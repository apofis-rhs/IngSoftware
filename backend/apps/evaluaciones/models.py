from django.db import models


class Evaluacion(models.Model):
    id_evaluacion = models.AutoField(primary_key=True)
    calificacion = models.IntegerField()
    comentario = models.TextField(null=True, blank=True)
    fecha_evaluacion = models.DateTimeField(auto_now_add=True)
    id_usuario = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.DO_NOTHING, db_column='id_usuario'
    )

    class Meta:
        managed = False
        db_table = 'evaluacion'
