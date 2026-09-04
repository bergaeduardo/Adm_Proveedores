from django.db import migrations, models
import Proveedores.models


class Migration(migrations.Migration):

    dependencies = [
        ('Proveedores', '0006_auto_20250527_1042'),
    ]

    operations = [
        migrations.AddField(
            model_name='proveedor',
            name='excl_iva_file',
            field=models.FileField(blank=True, null=True, upload_to=Proveedores.models.documentos_upload_path),
        ),
        migrations.AddField(
            model_name='proveedor',
            name='excl_iva_file_updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
