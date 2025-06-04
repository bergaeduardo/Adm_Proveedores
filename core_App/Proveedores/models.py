from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import os
import datetime

def documentos_upload_path(instance, filename):
    # Limpiar el nombre del proveedor para evitar caracteres problemáticos en la ruta
    # Usar username_django.username que es único y más predecible que nom_provee
    proveedor_identifier = instance.username_django.username if instance.username_django else 'sin_usuario'
    
    # Obtener el nombre del campo que está llamando a esta función
    # Esto requiere un pequeño truco o pasar el field_name explícitamente si es necesario diferenciar subcarpetas por tipo de doc.
    # Para este caso, todos van a una carpeta general de documentos del proveedor.
    # Opcional: crear subcarpetas por tipo de documento si es necesario
    # field_name = '' # Determinar el field_name si se necesita
    # subfolder = field_name.replace('_file', '') # ej: cuit, ingBrutos

    fecha_hoy = datetime.date.today()
    # Ruta: documentos/{username_proveedor}/{YYYY}/{MM}/{DD}/{filename}
    return f'documentos/{proveedor_identifier}/{fecha_hoy.year}/{fecha_hoy.month:02d}/{fecha_hoy.day:02d}/{filename}'

def comprobante_upload_path(instance, filename):
    proveedor_identifier = instance.proveedor.username_django.username if instance.proveedor.username_django else 'sin_usuario'
    fecha_hoy = datetime.date.today()
    return f'comprobantes/{proveedor_identifier}/{fecha_hoy.year}/{fecha_hoy.month:02d}/{fecha_hoy.day:02d}/{filename}'


class Proveedor(models.Model):
  cod_cpa01 = models.CharField(db_column='COD_CPA01', max_length=10, unique=True, blank=True, null=True)
  id_tipo_documento_gv = models.IntegerField(db_column='ID_TIPO_DOCUMENTO_GV', blank=True, null=True)
  n_cuit = models.CharField(db_column='N_CUIT', max_length=15, blank=True, null=True)
  nom_provee = models.CharField(db_column='NOM_PROVEE', max_length=60)
  domicilio = models.CharField(db_column='DOMICILIO', max_length=30, blank=True, null=True)
  localidad = models.CharField(db_column='LOCALIDAD', max_length=20, blank=True, null=True)
  c_postal = models.CharField(db_column='C_POSTAL', max_length=8, blank=True, null=True)
  id_cpa57 = models.IntegerField(db_column='ID_CPA57', blank=True, null=True)
  nom_prov = models.CharField(db_column='NOM_PROV', max_length=100, blank=True, null=True)
  telefono_1 = models.CharField(db_column='TELEFONO_1', max_length=30, blank=True, null=True)
  telefono_2 = models.CharField(db_column='TELEFONO_2', max_length=30, blank=True, null=True)
  telefono_movil = models.CharField(db_column='TELEFONO_MOVIL', max_length=30, blank=True, null=True)
  e_mail = models.CharField(db_column='E_MAIL', max_length=255, blank=True, null=True)
  web = models.CharField(db_column='WEB', max_length=60, blank=True, null=True)
  nom_fant = models.CharField(db_column='NOM_FANT', max_length=60, blank=True, null=True)
  domicilio_comercial = models.CharField(db_column='DOMICILIO_COMERCIAL', max_length=30, blank=True, null=True)
  id_gva151 = models.IntegerField(db_column='ID_GVA151', blank=True, null=True)
  n_iva = models.CharField(db_column='N_IVA', max_length=160, blank=True, null=True)
  fecha_alta = models.DateTimeField(db_column='FECHA_ALTA', blank=True, null=True)
  fecha_inha = models.DateTimeField(db_column='FECHA_INHA', blank=True, null=True)
  observacio = models.CharField(db_column='OBSERVACIO', max_length=60, blank=True, null=True)
  observac_2 = models.CharField(db_column='OBSERVAC_2', max_length=60, blank=True, null=True)
  id_categoria_iva_cond_iva = models.IntegerField(db_column='ID_CATEGORIA_IVA_COND_IVA', blank=True, null=True)
  tipo = models.CharField(db_column='TIPO', max_length=1, blank=True, null=True)
  n_ing_brut = models.CharField(db_column='N_ING_BRUT', max_length=20, blank=True, null=True)
  cm_vigencia_coeficiente = models.DateTimeField(db_column='CM_VIGENCIA_COEFICIENTE', blank=True, null=True)
  iva_l = models.BooleanField(db_column='IVA_L', blank=True, null=True)
  iva_s = models.BooleanField(db_column='IVA_S', blank=True, null=True)
  ii_l = models.BooleanField(db_column='II_L', blank=True, null=True)
  ii_s = models.BooleanField(db_column='II_S', blank=True, null=True)
  calcu_ret = models.CharField(db_column='CALCU_RET', max_length=1, blank=True, null=True)
  texto_ib_1 = models.CharField(db_column='TEXTO_IB_1', max_length=60, blank=True, null=True)
  texto_ib_2 = models.CharField(db_column='TEXTO_IB_2', max_length=60, blank=True, null=True)
  texto_ib_3 = models.CharField(db_column='TEXTO_IB_3', max_length=60, blank=True, null=True)
  texto_ib_4 = models.CharField(db_column='TEXTO_IB_4', max_length=60, blank=True, null=True)
  id_operacion_afip_rg_3685_tipo_operacion_compras = models.IntegerField(db_column='ID_OPERACION_AFIP_RG_3685_TIPO_OPERACION_COMPRAS', blank=True, null=True)
  id_tipo_comprobante_afip_rg_3685_comprobante_compras = models.IntegerField(db_column='ID_TIPO_COMPROBANTE_AFIP_RG_3685_COMPROBANTE_COMPRAS', blank=True, null=True)
  rg_3685_genera_informacion = models.BooleanField(db_column='RG_3685_GENERA_INFORMACION', blank=True, null=True)
  rg_3572_empresa_vinculada_proveedor = models.BooleanField(db_column='RG_3572_EMPRESA_VINCULADA_PROVEEDOR', blank=True, null=True)
  id_rg_3572_tipo_operacion_habitual_proveedor = models.IntegerField(db_column='ID_RG_3572_TIPO_OPERACION_HABITUAL_PROVEEDOR', blank=True, null=True)
  contfiscal = models.BooleanField(db_column='CONTFISCAL', blank=True, null=True)
  t_form = models.CharField(db_column='T_FORM', max_length=1, blank=True, null=True)
  cai = models.CharField(db_column='CAI', max_length=14, blank=True, null=True)
  fecha_vto = models.DateTimeField(db_column='FECHA_VTO', blank=True, null=True)
  citi_opera = models.CharField(db_column='CITI_OPERA', max_length=1, blank=True, null=True)
  citi_tipo = models.CharField(db_column='CITI_TIPO', max_length=1, blank=True, null=True)
  id_iva_clasificacion_siap_clas_siap = models.IntegerField(db_column='ID_IVA_CLASIFICACION_SIAP_CLAS_SIAP', blank=True, null=True)
  lim_credit = models.DecimalField(db_column='LIM_CREDIT', max_digits=22, decimal_places=7, blank=True, null=True)
  moneda_limite_credito_cte = models.BooleanField(db_column='MONEDA_LIMITE_CREDITO_CTE', blank=True, null=True)
  clausula = models.BooleanField(db_column='CLAUSULA', blank=True, null=True)
  inf_iva = models.CharField(db_column='INF_IVA', max_length=1, blank=True, null=True)
  num_automa = models.CharField(db_column='NUM_AUTOMA', max_length=1, blank=True, null=True)
  letra_habi = models.CharField(db_column='LETRA_HABI', max_length=1, blank=True, null=True)
  id_condicion_compra = models.IntegerField(db_column='ID_CONDICION_COMPRA', blank=True, null=True)
  porc_desc = models.DecimalField(db_column='PORC_DESC', max_digits=22, decimal_places=7, blank=True, null=True)
  mon_cte_ha = models.CharField(db_column='MON_CTE_HA', max_length=1, blank=True, null=True)
  inc_iva_li = models.BooleanField(db_column='INC_IVA_LI', blank=True, null=True)
  inc_ii_lis = models.BooleanField(db_column='INC_II_LIS', blank=True, null=True)
  edita_comprobante_referencia_remito = models.CharField(db_column='EDITA_COMPROBANTE_REFERENCIA_REMITO', max_length=1, blank=True, null=True)
  defecto_comprobante_referencia_remito = models.CharField(db_column='DEFECTO_COMPROBANTE_REFERENCIA_REMITO', max_length=3, blank=True, null=True)
  edita_comprobante_referencia_factura_remito = models.CharField(db_column='EDITA_COMPROBANTE_REFERENCIA_FACTURA_REMITO', max_length=1, blank=True, null=True)
  defecto_comprobante_referencia_factura_remito = models.CharField(db_column='DEFECTO_COMPROBANTE_REFERENCIA_FACTURA_REMITO', max_length=3, blank=True, null=True)
  ingresa_factura_sin_remito_asociado = models.BooleanField(db_column='INGRESA_FACTURA_SIN_REMITO_ASOCIADO', blank=True, null=True)
  edita_comprobante_referencia_factura = models.CharField(db_column='EDITA_COMPROBANTE_REFERENCIA_FACTURA', max_length=1, blank=True, null=True)
  defecto_comprobante_referencia_factura = models.CharField(db_column='DEFECTO_COMPROBANTE_REFERENCIA_FACTURA', max_length=3, blank=True, null=True)
  exporta = models.BooleanField(db_column='EXPORTA', blank=True, null=True)
  id_sucursal_destino = models.IntegerField(db_column='ID_SUCURSAL_DESTINO', blank=True, null=True)
  id_sba01_cfondo_pm = models.IntegerField(db_column='ID_SBA01_CFONDO_PM', blank=True, null=True)
  id_sba01_cfunica_pm = models.IntegerField(db_column='ID_SBA01_CFUNICA_PM', blank=True, null=True)
  pago_che = models.BooleanField(db_column='PAGO_CHE', blank=True, null=True)
  dias_ch_pm = models.IntegerField(db_column='DIAS_CH_PM', blank=True, null=True)
  cbu = models.CharField(db_column='CBU', max_length=22, blank=True, null=True)
  descripcion_cbu = models.CharField(db_column='DESCRIPCION_CBU', max_length=30, blank=True, null=True)
  cbu_2 = models.CharField(db_column='CBU_2', max_length=22, blank=True, null=True)
  descripcion_cbu_2 = models.CharField(db_column='DESCRIPCION_CBU_2', max_length=30, blank=True, null=True)
  cbu_3 = models.CharField(db_column='CBU_3', max_length=22, blank=True, null=True)
  descripcion_cbu_3 = models.CharField(db_column='DESCRIPCION_CBU_3', max_length=30, blank=True, null=True)
  orden = models.CharField(db_column='ORDEN', max_length=60, blank=True, null=True)
  habil_pm = models.BooleanField(db_column='HABIL_PM', blank=True, null=True)
  observaciones = models.TextField(db_column='OBSERVACIONES', blank=True, null=True)
  texto = models.TextField(db_column='TEXTO', blank=True, null=True)
  tipo_doc = models.IntegerField(db_column='TIPO_DOC', blank=True, null=True)
  saldo_cc_unidades = models.DecimalField(db_column='SALDO_CC_UNIDADES', max_digits=22, decimal_places=7, blank=True, null=True)
  cod_descrip = models.TextField(db_column='COD_DESCRIP', blank=True, null=True)
  proveedor_cm_jurisdiccion = models.JSONField(db_column='PROVEEDOR_CM_JURISDICCION', blank=True, null=True)
  retenciones = models.JSONField(db_column='RETENCIONES', blank=True, null=True)
  articulos = models.JSONField(db_column='ARTICULOS', blank=True, null=True)
  conceptos = models.JSONField(db_column='CONCEPTOS', blank=True, null=True)
  contactos = models.JSONField(db_column='CONTACTOS', blank=True, null=True)
  sucursales = models.JSONField(db_column='SUCURSALES', blank=True, null=True)
  username_django = models.ForeignKey(User, db_column='USERNAME_DJANGO', on_delete=models.SET_NULL, null=True, blank=True, related_name='proveedores')
  cod_pais = models.CharField(db_column='COD_PAIS', max_length=2, blank=True, null=True)
  nom_pais = models.CharField(db_column='NOM_PAIS', max_length=60, blank=True, null=True)
  cond_iva = models.CharField(db_column='COND_IVA', max_length=5, blank=True, null=True)
  desc_categoria_iva = models.CharField(db_column='DESC_CATEGORIA_IVA', max_length=50, blank=True, null=True)

  # Documentos adjuntos
  cuit_file = models.FileField(upload_to=documentos_upload_path, blank=True, null=True)
  ing_brutos_file = models.FileField(upload_to=documentos_upload_path, blank=True, null=True)
  excl_ganancias_file = models.FileField(upload_to=documentos_upload_path, blank=True, null=True)
  cm05_file = models.FileField(upload_to=documentos_upload_path, blank=True, null=True)
  no_ret_ganancias_file = models.FileField(upload_to=documentos_upload_path, blank=True, null=True) # Certificado de No Retención de ganancias
  excl_iibb_file = models.FileField(upload_to=documentos_upload_path, blank=True, null=True)        # Certificado de Exclusión de Ingresos Brutos
  no_ret_iibb_file = models.FileField(upload_to=documentos_upload_path, blank=True, null=True)      # Certificado de No Retención de Ingresos Brutos

  # Fechas de actualización de cada archivo
  cuit_file_updated_at = models.DateTimeField(blank=True, null=True)
  ing_brutos_file_updated_at = models.DateTimeField(blank=True, null=True)
  excl_ganancias_file_updated_at = models.DateTimeField(blank=True, null=True)
  cm05_file_updated_at = models.DateTimeField(blank=True, null=True)
  no_ret_ganancias_file_updated_at = models.DateTimeField(blank=True, null=True)
  excl_iibb_file_updated_at = models.DateTimeField(blank=True, null=True)
  no_ret_iibb_file_updated_at = models.DateTimeField(blank=True, null=True)

  def __str__(self):
    return self.nom_provee

class Comprobante(models.Model):
  class TipoComprobante(models.TextChoices):
    FACTURA_A = 'Factura A', _('Factura A')
    FACTURA_B = 'Factura B', _('Factura B')
    FACTURA_C = 'Factura C', _('Factura C')
    NOTA_CREDITO = 'Nota de Crédito', _('Nota de Crédito')
    NOTA_DEBITO = 'Nota de Débito', _('Nota de Débito')

  proveedor = models.ForeignKey('Proveedor', on_delete=models.CASCADE, related_name='comprobantes')
  tipo = models.CharField(max_length=20, choices=TipoComprobante.choices)
  numero = models.CharField(max_length=50)
  fecha_emision = models.DateField()
  monto_total = models.DecimalField(max_digits=14, decimal_places=2)
  archivo = models.FileField(upload_to=comprobante_upload_path)
  estado = models.CharField(max_length=20, default='Recibido')
  creado_en = models.DateTimeField(auto_now_add=True)

  class Meta:
    verbose_name = 'Comprobante'
    verbose_name_plural = 'Comprobantes'
    ordering = ['-creado_en']

  def __str__(self):
    return f"{self.tipo} {self.numero} - {self.proveedor.nom_provee}"

  def filename(self):
    return os.path.basename(self.archivo.name)
  

class CpaContactosProveedorHabitual(models.Model):
    id = models.AutoField(primary_key=True)
    id_cpa_contactos_proveedor_habitual_sql = models.IntegerField(
        db_column='ID_CPA_CONTACTOS_PROVEEDOR_HABITUAL_SQL', # Nombre de columna en PostgreSQL
        blank=True, 
        null=True,
        help_text="ID de la tabla original en SQL Server, se llena después de la sincronización."
    )
    cargo = models.CharField(db_column='CARGO', max_length=20, blank=True, null=True)  # Field name made lowercase.       
    defecto = models.CharField(db_column='DEFECTO', max_length=1, blank=True, null=True)  # Field name made lowercase.    
    cod_provee = models.CharField(db_column='COD_PROVEE', max_length=6,blank=True, null=True)  # Field name made lowercase.
    nombre = models.CharField(db_column='NOMBRE', max_length=30, blank=True, null=True)  # Field name made lowercase.     
    telefono = models.CharField(db_column='TELEFONO', max_length=30, blank=True, null=True)  # Field name made lowercase. 
    telefono_movil = models.CharField(db_column='TELEFONO_MOVIL', max_length=30, blank=True, null=True)  # Field name made lowercase.
    email = models.CharField(db_column='EMAIL', max_length=255, blank=True, null=True)  # Field name made lowercase.      
    direccion = models.CharField(db_column='DIRECCION', max_length=30, blank=True, null=True)  # Field name made lowercase.
    observacion = models.CharField(db_column='OBSERVACION', max_length=60, blank=True, null=True)  # Field name made lowercase.
    tipo_documento = models.SmallIntegerField(db_column='TIPO_DOCUMENTO', blank=True, null=True)  # Field name made lowercase.
    numero_documento = models.CharField(db_column='NUMERO_DOCUMENTO', max_length=20, blank=True, null=True)  # Field name made lowercase.
    envia_pdf_oc = models.CharField(db_column='ENVIA_PDF_OC', max_length=1, blank=True, null=True)  # Field name made lowercase.
    envia_pdf_op = models.CharField(db_column='ENVIA_PDF_OP', max_length=1, blank=True, null=True)  # Field name made lowercase.
    username_django = models.ForeignKey(User, db_column='USERNAME_DJANGO', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'proveedores_cpacontactosproveedorhabitual_staging'
        unique_together = (('cod_provee', 'nombre'),)

    def __str__(self):
      return f"{self.nombre} (Staging ID: {self.id})"