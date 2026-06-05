from django.db import models


class Articulo(models.Model):
    id_articulo = models.AutoField(primary_key=True)
    nombre_articulo = models.CharField(max_length=200)
    impacto_ambiental = models.TextField()
    id_subcategoria = models.ForeignKey(
        'productos.Subcategoria',
        on_delete=models.DO_NOTHING,
        db_column='id_subcategoria',
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = 'articulo'


class Alternativa(models.Model):
    id_alternativa = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(null=True, blank=True)
    precio_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    precio_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    id_articulo = models.ForeignKey(
        Articulo, on_delete=models.DO_NOTHING, db_column='id_articulo'
    )

    class Meta:
        managed = False
        db_table = 'alternativa'
