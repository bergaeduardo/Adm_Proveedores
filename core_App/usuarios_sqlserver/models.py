from django.db import models

class SofUsuario(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID')
    nombre = models.CharField(max_length=100, db_column='NOMBRE')
    # Agrega aquí los demás campos según la estructura real de SOF_USUARIOS

    class Meta:
        db_table = 'SOF_USUARIOS'
        managed = False  # Solo lectura, no migrar
        app_label = 'usuarios_sqlserver'

    def __str__(self):
        return self.nombre
