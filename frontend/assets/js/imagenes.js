// imagenes.js
// El campo 'imagen' ya viene del backend (ej: "head-and-shoulders-classic-clean-shampoo.jpg")
// Solo necesitamos la carpeta según id_subcategoria

const SUBCAT_CARPETA = {
  1:'cuidadoPiel', 2:'cuidadoPiel', 3:'cuidadoPiel', 4:'cuidadoPiel', 5:'cuidadoPiel',
  6:'cuidadoCapilar', 7:'cuidadoCapilar', 8:'cuidadoCapilar', 9:'cuidadoCapilar',
  10:'cuidadoCapilar', 11:'cuidadoCapilar',
  12:'cuidadoCorporal', 13:'cuidadoCorporal', 14:'cuidadoCorporal', 15:'cuidadoCorporal',
  16:'higieneBP', 17:'higieneBP',
  21:'depilacionAP', 22:'depilacionAP', 23:'depilacionAP',
  26:'higieneIntima', 27:'higieneIntima', 28:'higieneIntima', 29:'higieneIntima',
};

export function getRutaImagen(item) {
  const imagen = item.imagen;
  const idSub  = item.id_subcategoria;

  if (!imagen) return '/assets/images/placeholder.svg';

  // id_subcategoria puede llegar como número, string, o FK object
  const subId   = typeof idSub === 'object' ? (idSub?.id_subcategoria ?? idSub) : idSub;
  const carpeta = SUBCAT_CARPETA[Number(subId)] || 'cuidadoPiel';

  return `/assets/images/productos/${carpeta}/${imagen}`;
}
