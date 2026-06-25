
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('Proveedores', '0006_auto_20250527_1042'),
    ]

    operations = [
        migrations.CreateModel(
            name='Turno',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nro_orden_co', models.CharField(max_length=20)),
                ('fecha_turno', models.DateField()),
                ('hora_turno', models.TimeField()),
                ('estado', models.CharField(choices=[('Solicitado', 'Solicitado'), ('Agendado', 'Agendado'), ('Rechazado', 'Rechazado'), ('Completado', 'Completado')], default='Solicitado', max_length=20)),
                ('fecha_posicionamiento', models.DateField(blank=True, null=True)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('actualizado_en', models.DateTimeField(auto_now=True)),
                ('proveedor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='turnos', to='Proveedores.proveedor')),
            ],
            options={
                'verbose_name': 'Turno',
                'verbose_name_plural': 'Turnos',
                'ordering': ['-fecha_turno', '-hora_turno'],
            },
        ),
        migrations.CreateModel(
            name='TurnoItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cod_articulo', models.CharField(max_length=50)),
                ('descripcion', models.CharField(max_length=255)),
                ('cantidad_a_entregar', models.DecimalField(decimal_places=2, max_digits=12)),
                ('turno', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles', to='Proveedores.turno')),
            ],
            options={
                'verbose_name': 'Ítem de Turno',
                'verbose_name_plural': 'Ítems de Turno',
            },
        ),
    ]
