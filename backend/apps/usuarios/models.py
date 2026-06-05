from django.db import models


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    nombre_completo = models.CharField(max_length=200)
    nombre_usuario = models.CharField(max_length=100, unique=True)
    correo = models.CharField(max_length=200, unique=True)
    contrasena = models.CharField(max_length=255)
    rol = models.CharField(max_length=10, default='usuario')
    estatus_cuenta = models.CharField(max_length=20, default='inactivo')
    acepto_terminos = models.BooleanField(default=False)
    token_verificacion = models.CharField(max_length=255, null=True, blank=True)
    token_recuperacion = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'usuario'

    def __str__(self):
        return self.nombre_usuario


class Consulta(models.Model):
    id_consulta = models.AutoField(primary_key=True)
    fecha_consulta = models.DateTimeField(auto_now_add=True)
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.DO_NOTHING, db_column='id_usuario'
    )
    id_producto = models.ForeignKey(
        'productos.Producto', on_delete=models.DO_NOTHING, db_column='id_producto'
    )

    class Meta:
        managed = False
        db_table = 'consulta'


class ConsultaArticulo(models.Model):
    id_consulta_articulo = models.AutoField(primary_key=True)
    fecha_consulta = models.DateTimeField(auto_now_add=True)
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.DO_NOTHING, db_column='id_usuario'
    )
    id_articulo = models.ForeignKey(
        'articulos.Articulo', on_delete=models.DO_NOTHING, db_column='id_articulo'
    )

    class Meta:
        managed = False
        db_table = 'consulta_articulo'


class Favorito(models.Model):
    id_favorito = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.DO_NOTHING, db_column='id_usuario'
    )
    id_producto = models.ForeignKey(
        'productos.Producto', on_delete=models.DO_NOTHING, db_column='id_producto'
    )

    class Meta:
        managed = False
        db_table = 'favorito'
        unique_together = [['id_usuario', 'id_producto']]
