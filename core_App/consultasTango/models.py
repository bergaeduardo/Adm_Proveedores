# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Cpa57(models.Model):
    filler = models.CharField(db_column='FILLER', max_length=20, blank=True, null=True)  # Field name made lowercase.
    cod_provin = models.CharField(db_column='COD_PROVIN', unique=True, max_length=2)  # Field name made lowercase.
    cod_sicore = models.SmallIntegerField(db_column='COD_SICORE', blank=True, null=True)  # Field name made lowercase.
    cod_sifere = models.SmallIntegerField(db_column='COD_SIFERE', blank=True, null=True)  # Field name made lowercase.
    nom_provin = models.CharField(db_column='NOM_PROVIN', max_length=20, blank=True, null=True)  # Field name made lowercase.
    cod_pais = models.CharField(db_column='COD_PAIS', max_length=2, blank=True, null=True)  # Field name made lowercase.
    cod_cpa57 = models.CharField(db_column='COD_CPA57', unique=True, max_length=4)  # Field name made lowercase.
    observaciones = models.TextField(db_column='OBSERVACIONES', blank=True, null=True)  # Field name made lowercase.
    id_cpa57 = models.IntegerField(db_column='ID_CPA57', primary_key=True)  # Field name made lowercase.
    cod_cpa108 = models.CharField(db_column='COD_CPA108', max_length=4, blank=True, null=True)  # Field name made lowercase.
    row_version = models.TextField(db_column='ROW_VERSION')  # Field name made lowercase. This field type is a guess.
    campos_adicionales = models.TextField(db_column='CAMPOS_ADICIONALES', blank=True, null=True)  # Field name made lowercase. This field type is a guess.
    id_cpa108 = models.ForeignKey('Cpa108', models.DO_NOTHING, db_column='ID_CPA108', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'CPA57'


class Cpa108(models.Model):
    cod_pais = models.CharField(db_column='COD_PAIS', unique=True, max_length=2)  # Field name made lowercase.
    nom_pais = models.CharField(db_column='NOM_PAIS', max_length=20, blank=True, null=True)  # Field name made lowercase.
    cuit_fisic = models.CharField(db_column='CUIT_FISIC', max_length=20, blank=True, null=True)  # Field name made lowercase.
    cuit_jurid = models.CharField(db_column='CUIT_JURID', max_length=20, blank=True, null=True)  # Field name made lowercase.
    filler = models.CharField(db_column='FILLER', max_length=20, blank=True, null=True)  # Field name made lowercase.
    cod_cpa108 = models.CharField(db_column='COD_CPA108', unique=True, max_length=4)  # Field name made lowercase.
    observaciones = models.TextField(db_column='OBSERVACIONES', blank=True, null=True)  # Field name made lowercase.
    id_cpa108 = models.IntegerField(db_column='ID_CPA108', primary_key=True)  # Field name made lowercase.
    row_version = models.TextField(db_column='ROW_VERSION')  # Field name made lowercase. This field type is a guess.
    campos_adicionales = models.TextField(db_column='CAMPOS_ADICIONALES', blank=True, null=True)  # Field name made lowercase. This field type is a guess.

    class Meta:
        managed = False
        db_table = 'CPA108'


class OperacinAfip(models.Model):
    id_operacion_afip = models.IntegerField(db_column='ID_OPERACION_AFIP', primary_key=True)  # Field name made lowercase.
    cod_operacion_afip = models.CharField(db_column='COD_OPERACION_AFIP', max_length=1)  # Field name made lowercase.
    desc_operacion_afip = models.CharField(db_column='DESC_OPERACION_AFIP', max_length=40)  # Field name made lowercase.
    modulo = models.CharField(db_column='MODULO', max_length=1)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'OPERACIÓN_AFIP'
        unique_together = (('cod_operacion_afip', 'modulo'), ('cod_operacion_afip', 'modulo'),)


class TipoComprobanteAfip(models.Model):
    id_tipo_comprobante_afip = models.IntegerField(db_column='ID_TIPO_COMPROBANTE_AFIP', primary_key=True)  # Field name made lowercase.
    cod_tipo_comprobante_afip = models.CharField(db_column='COD_TIPO_COMPROBANTE_AFIP', unique=True, max_length=3)  # Field name made lowercase.
    desc_tipo_comprobante_afip = models.CharField(db_column='DESC_TIPO_COMPROBANTE_AFIP', max_length=90)  # Field name made lowercase.
    cod_tipo_comprobante_interno = models.CharField(db_column='COD_TIPO_COMPROBANTE_INTERNO', max_length=6, blank=True, null=True)  # Field name made lowercase.
    letra_comprobante = models.CharField(db_column='LETRA_COMPROBANTE', max_length=1, blank=True, null=True)  # Field name made lowercase.
    habilitado_compra = models.CharField(db_column='HABILITADO_COMPRA', max_length=1)  # Field name made lowercase.
    habilitado_venta = models.CharField(db_column='HABILITADO_VENTA', max_length=1)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'TIPO_COMPROBANTE_AFIP'


class SofUsuarios(models.Model):
    id = models.IntegerField(db_column='ID',primary_key=True)  # Field name made lowercase.
    nombre = models.CharField(db_column='NOMBRE', max_length=25)  # Field name made lowercase.
    pass_field = models.CharField(db_column='PASS', max_length=25)  # Field name made lowercase. Field renamed because it was a Python reserved word.
    permisos = models.IntegerField(db_column='PERMISOS', blank=True, null=True)  # Field name made lowercase.
    dsn = models.CharField(db_column='DSN', max_length=30, blank=True, null=True)  # Field name made lowercase.
    descripcion = models.CharField(db_column='DESCRIPCION', max_length=100, blank=True, null=True)  # Field name made lowercase.
    cod_client = models.CharField(db_column='COD_CLIENT', max_length=10, blank=True, null=True)  # Field name made lowercase.
    nro_sucurs = models.IntegerField(db_column='NRO_SUCURS', blank=True, null=True)  # Field name made lowercase.
    cod_vended = models.CharField(db_column='COD_VENDED', max_length=10, blank=True, null=True)  # Field name made lowercase.
    tango = models.CharField(db_column='TANGO', max_length=2, blank=True, null=True)  # Field name made lowercase.
    cod_deposi = models.CharField(db_column='COD_DEPOSI', max_length=2, blank=True, null=True)  # Field name made lowercase.
    tipo = models.CharField(db_column='TIPO', max_length=20, blank=True, null=True)  # Field name made lowercase.
    is_outlet = models.IntegerField(db_column='IS_OUTLET', blank=True, null=True)  # Field name made lowercase.
    sj_users_roles_id = models.IntegerField(blank=True, null=True)
    sj_users_sectores_id = models.IntegerField(blank=True, null=True)
    mail = models.CharField(db_column='MAIL', max_length=50, blank=True, null=True)  # Field name made lowercase.
    notifica = models.IntegerField(db_column='NOTIFICA', blank=True, null=True)  # Field name made lowercase.
    is_user_uy = models.CharField(db_column='IS_USER_UY', max_length=2, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'SOF_USUARIOS'
