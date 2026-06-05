from django.db import models


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'categoria'


class Subcategoria(models.Model):
    id_subcategoria = models.AutoField(primary_key=True)
    nombre_subcategoria = models.CharField(max_length=100)
    id_categoria = models.ForeignKey(
        Categoria, on_delete=models.DO_NOTHING, db_column='id_categoria'
    )

    class Meta:
        managed = False
        db_table = 'subcategoria'


class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    nombre_producto = models.CharField(max_length=200)
    precio_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    precio_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    color_semaforo = models.CharField(max_length=20, null=True, blank=True)
    razon_clasificacion = models.CharField(max_length=500, null=True, blank=True)
    estado_evaluacion = models.CharField(max_length=20, null=True, blank=True)
    id_subcategoria = models.ForeignKey(
        Subcategoria, on_delete=models.DO_NOTHING, db_column='id_subcategoria'
    )

    class Meta:
        managed = False
        db_table = 'producto'


class Criterio(models.Model):
    id_criterio = models.AutoField(primary_key=True)
    nombre_criterio = models.CharField(max_length=200)
    descripcion = models.CharField(max_length=500, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'criterio'


class Ventaja(models.Model):
    id_ventaja = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=500)
    id_producto = models.ForeignKey(
        Producto, on_delete=models.DO_NOTHING, db_column='id_producto'
    )

    class Meta:
        managed = False
        db_table = 'ventaja'


class Desventaja(models.Model):
    id_desventaja = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=500)
    id_producto = models.ForeignKey(
        Producto, on_delete=models.DO_NOTHING, db_column='id_producto'
    )

    class Meta:
        managed = False
        db_table = 'desventaja'


class Caracteristica(models.Model):
    id_caracteristica = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=500)
    id_producto = models.ForeignKey(
        Producto, on_delete=models.DO_NOTHING, db_column='id_producto'
    )

    class Meta:
        managed = False
        db_table = 'caracteristica'
