from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('Proveedores', '0007_turnos'),
    ]

    operations = [
        migrations.AddField(
            model_name='turno',
            name='hora_fin',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='turno',
            name='cantidad_bultos',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='turno',
            name='remitos',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='turno',
            name='observaciones',
            field=models.TextField(blank=True, null=True),
        ),
    ]
