import os
import shutil
import unicodedata
import re
from urllib.parse import unquote

from django.core.management.base import BaseCommand
from django.conf import settings

from Proveedores.models import Proveedor, Comprobante


def sanitize_username_for_path(username):
    """Misma lógica que en models.py para garantizar consistencia."""
    if not username:
        return 'sin_usuario'
    normalized = unicodedata.normalize('NFD', username)
    without_accents = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    safe = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', without_accents)
    safe = re.sub(r'_+', '_', safe).strip('_')
    return safe or 'sin_usuario'


class Command(BaseCommand):
    help = (
        'Corrige las rutas de archivos de usuarios cuyos usernames contienen '
        'acentos, espacios u otros caracteres especiales. '
        'Renombra las carpetas en disco y actualiza los paths en la base de datos.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué cambios se harían sin aplicarlos.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        media_root = settings.MEDIA_ROOT

        if dry_run:
            self.stdout.write(self.style.WARNING('--- MODO DRY-RUN: no se aplicará ningún cambio ---\n'))

        renamed_dirs = set()  # Evita intentar renombrar la misma carpeta dos veces
        total_users = 0
        total_files = 0

        for proveedor in Proveedor.objects.select_related('username_django').all():
            if not proveedor.username_django:
                continue

            username = proveedor.username_django.username
            sanitized = sanitize_username_for_path(username)

            if username == sanitized:
                continue  # Este usuario no tiene problema

            total_users += 1
            self.stdout.write(f'\nUsuario: "{username}"  →  "{sanitized}"')

            # ----------------------------------------------------------------
            # 1. Renombrar carpetas en disco
            # ----------------------------------------------------------------
            for subfolder in ('comprobantes', 'documentos'):
                # Variantes posibles del nombre de carpeta problemático
                candidates = [
                    os.path.join(media_root, subfolder, username),
                    os.path.join(media_root, subfolder, unquote(username)),
                ]
                new_dir = os.path.join(media_root, subfolder, sanitized)
                dir_key = (subfolder, sanitized)

                for old_dir in candidates:
                    if dir_key in renamed_dirs:
                        break
                    if not os.path.isdir(old_dir):
                        continue
                    if old_dir == new_dir:
                        break

                    self.stdout.write(f'  [disco] {old_dir}  →  {new_dir}')
                    if not dry_run:
                        if os.path.exists(new_dir):
                            # Destino ya existe: mover el contenido dentro
                            for item in os.listdir(old_dir):
                                src = os.path.join(old_dir, item)
                                dst = os.path.join(new_dir, item)
                                shutil.move(src, dst)
                            shutil.rmtree(old_dir)
                        else:
                            os.rename(old_dir, new_dir)
                        renamed_dirs.add(dir_key)
                    break  # Solo procesar el primer candidato encontrado

            # ----------------------------------------------------------------
            # 2. Actualizar paths en DB: campos FileField de Proveedor
            # ----------------------------------------------------------------
            file_fields = [
                'cuit_file', 'ing_brutos_file', 'excl_ganancias_file',
                'cm05_file', 'no_ret_ganancias_file', 'excl_iibb_file',
                'no_ret_iibb_file', 'cbu_file',
            ]
            proveedor_changed = False
            for field_name in file_fields:
                field_value = getattr(proveedor, field_name)
                if not field_value or not field_value.name:
                    continue

                old_path = field_value.name
                new_path = old_path

                # Reemplazar todas las variantes posibles del username en el path
                for variant in (username, unquote(username)):
                    new_path = new_path.replace(
                        f'documentos/{variant}/', f'documentos/{sanitized}/'
                    )

                if new_path != old_path:
                    total_files += 1
                    self.stdout.write(f'  [db proveedor] {field_name}: {old_path}  →  {new_path}')
                    if not dry_run:
                        setattr(proveedor, field_name, new_path)
                        proveedor_changed = True

            if proveedor_changed and not dry_run:
                proveedor.save()

            # ----------------------------------------------------------------
            # 3. Actualizar paths en DB: Comprobante.archivo
            # ----------------------------------------------------------------
            for comp in Comprobante.objects.filter(proveedor=proveedor):
                if not comp.archivo or not comp.archivo.name:
                    continue

                old_path = comp.archivo.name
                new_path = old_path

                for variant in (username, unquote(username)):
                    new_path = new_path.replace(
                        f'comprobantes/{variant}/', f'comprobantes/{sanitized}/'
                    )

                if new_path != old_path:
                    total_files += 1
                    self.stdout.write(f'  [db comprobante #{comp.id}] {old_path}  →  {new_path}')
                    if not dry_run:
                        comp.archivo.name = new_path
                        comp.save(update_fields=['archivo'])

        # ----------------------------------------------------------------
        # Resumen final
        # ----------------------------------------------------------------
        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'DRY-RUN completado: {total_users} usuario(s) afectado(s), '
                f'{total_files} path(s) de archivo serían actualizados.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Corrección completada: {total_users} usuario(s) procesado(s), '
                f'{total_files} path(s) de archivo actualizados.'
            ))
