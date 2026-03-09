# Generated migration - Cambiar Num_Oc de CharField a JSONField para soportar múltiples OC

from django.db import migrations, models


def migrar_num_oc_a_json(apps, schema_editor):
    """
    Prepara el campo Num_Oc para ser convertido a JSONField:
    - Cadenas vacías → NULL
    - Texto plano (ej. "0001-00012345") → wrappea en lista JSON usando SQL directo,
      para preservar el dato existente.
    """
    import json
    Comprobante = apps.get_model('Proveedores', 'Comprobante')
    # Vacíos → NULL
    Comprobante.objects.filter(Num_Oc='').update(Num_Oc=None)
    # Valores que ya son JSON válido (empiezan con '[' o '{') se dejan tal cual.
    # Valores de texto plano → convertir a lista de un elemento para preservar el dato.
    for comp in Comprobante.objects.filter(Num_Oc__isnull=False).exclude(Num_Oc__startswith='['):
        valor_original = comp.Num_Oc.strip()
        if valor_original:
            # Usar UPDATE directo con JSON literal para evitar que Django intente
            # serializar el valor como VARCHAR al hacer .save()
            table = Comprobante._meta.db_table
            schema_editor.connection.cursor().execute(
                f'UPDATE "{table}" SET "Num_Oc" = %s WHERE id = %s',
                [json.dumps([valor_original]), comp.id]
            )
        else:
            Comprobante.objects.filter(pk=comp.pk).update(Num_Oc=None)


class Migration(migrations.Migration):

    dependencies = [
        ('Proveedores', '0011_comprobante_num_oc'),
    ]

    operations = [
        # Primero limpiar valores que no son JSON válidos
        migrations.RunPython(migrar_num_oc_a_json, migrations.RunPython.noop),
        # Luego alterar el tipo de campo
        migrations.AlterField(
            model_name='comprobante',
            name='Num_Oc',
            field=models.JSONField(blank=True, null=True, verbose_name='Órdenes de Compra asociadas'),
        ),
    ]
