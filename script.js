// script.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://zjtdiracprhqhetxpnou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdGRpcmFjcHJocWhldHhwbm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MjU2OTUsImV4cCI6MjA2NzUwMTY5NX0.A9yKjvSSQVsjAGKWbLa9wTTiez5sm8uPvSZ9bNoLB6w';

const supabase = createClient(supabaseUrl, supabaseKey);


let productos = [];
let productoSeleccionado = null;

// Carga los productos (bonsáis) disponibles desde Supabase
async function cargarProductos() {
  const { data, error } = await supabase
    .from('registrosbonsai')
    .select('*')


  if (error) {
    console.error('Error cargando productos:', error);
    return;
  }

  productos = data;
  renderizarTienda();
}

// Renderiza los productos en la tienda
function renderizarTienda() {
  const tienda = document.getElementById("tienda");
  tienda.innerHTML = "";
  productos.forEach((prod, index) => {
    tienda.innerHTML += `
      <div class="producto ${!prod.a_la_venta ? 'producto-vendido' : ''}" style="position: relative;">
        <img src="${prod.imagen}" alt="Bonsái" />
        ${!prod.a_la_venta ? `<div class="vendido">VENDIDO</div>` : ''}
        <h3>${prod.nombre}</h3>
        <p class="codigo">Código: ${prod.codigo}</p>
        ${
          prod.a_la_venta
            ? `<button class="boton-comprar" onclick="verCatalogo(${index})">Ver Más</button>`
            : ''
        }
      </div>
    `;
  });


  document.getElementById("cargando").style.display = "none";
}

// Muestra el modal catálogo con los detalles del producto seleccionado
function verCatalogo(index) {
  productoSeleccionado = productos[index];
  document.getElementById("catalogoImagen").src = productoSeleccionado.imagen;
  document.getElementById("catalogoNombre").textContent = productoSeleccionado.nombre;
  document.getElementById("catalogoDescripcion").textContent = productoSeleccionado.descripcion;
  document.getElementById("catalogoPrecio").textContent = `Precio: ${productoSeleccionado.precio} Bs`;
  document.getElementById("catalogoCodigo").textContent = productoSeleccionado.codigo ? `Código Bonsái: ${productoSeleccionado.codigo}` : '';
  mostrarModal('modalCatalogo');
}

// Finaliza la compra: valida, guarda la venta y muestra el QR
async function finalizarCompra() {
  const nombre = document.getElementById("nombre").value;
  const direccion = document.getElementById("direccion").value;
  const telefono = document.getElementById("telefono").value;

  if (nombre && direccion && telefono) {
    await guardarVenta();
  } else {
    alert("Por favor completa todos los campos.");
  }
}

// Muestra un modal por id
function mostrarModal(id) {
  if (id === 'modalQR') {
    document.getElementById('imagenQR').src = 'IMG-20250625-WA0012.jpg';
  }

  if (id === 'modalCompra') {
    document.getElementById("nombre").value = "";
    document.getElementById("direccion").value = "";
    document.getElementById("telefono").value = "";
  }
  if (id === 'modalVerPedido') {
    // Limpiar input y resultado
    document.getElementById('codigoPedido').value = '';
    document.getElementById('seguimientoPedido').innerHTML = '';
  }

  const modal = document.getElementById(id);
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("mostrar");
  }, 10);

  document.getElementById('btnAdmin').classList.add('ocultar');
}

// Cierra un modal por id
function cerrarModal(id) {
  const modal = document.getElementById(id);

  // Quita 'mostrar' si estaba activo
  modal.classList.remove("mostrar");

  // Agrega la animación de salida
  modal.classList.add("ocultando");

  setTimeout(() => {
    modal.style.display = "none";
    modal.classList.remove("ocultando");
  }, 700); // Debe coincidir con la duración de puzzleOut

  document.getElementById('btnAdmin').classList.remove('ocultar');
}


// Agrega un nuevo bonsái subiendo imagen y guardando en Supabase
async function agregarProducto() {
  const nombre = document.getElementById("nuevoNombre").value;
  const descripcion = document.getElementById("nuevoDescripcion").value;
  const precio = parseFloat(document.getElementById("nuevoPrecio").value);
  const codigo = document.getElementById("nuevoCodigo").value;
  const imagenInput = document.getElementById("nuevoImagen");

  if (!nombre || !descripcion || isNaN(precio) || !codigo || !imagenInput.files[0]) {
    alert("Completa todos los campos y selecciona una imagen.");
    return;
  }

  const imagenFile = imagenInput.files[0];
  const filePath = `${Date.now()}_${imagenFile.name}`;

  // Subir imagen al bucket "bonsais"
  const { error: uploadError } = await supabase
    .storage
    .from('bonsais')
    .upload(filePath, imagenFile);

  if (uploadError) {
    alert("Error subiendo la imagen: " + uploadError.message);
    return;
  }

  // Obtener URL pública
  const imagenUrl = `${supabaseUrl}/storage/v1/object/public/bonsais/${filePath}`;

  // Insertar bonsái en la tabla
  const { error: insertError } = await supabase
    .from('registrosbonsai')
    .insert([
      {
        nombre,
        descripcion,
        precio,
        codigo,
        imagen: imagenUrl,
        a_la_venta: true
      }
    ]);

  if (insertError) {
    alert("Error guardando bonsái: " + insertError.message);
    return;
  }

  cerrarModal('modalAdmin');

  // Limpiar formulario
  document.getElementById("nuevoNombre").value = "";
  document.getElementById("nuevoDescripcion").value = "";
  document.getElementById("nuevoPrecio").value = "";
  document.getElementById("nuevoCodigo").value = "";
  document.getElementById("nuevoImagen").value = "";

  // Recargar lista de productos
  cargarProductos();
}

// Función para obtener fecha en formato ISO ajustada a hora Bolivia (UTC-4)
function obtenerFechaBoliviaISO() {
  const ahora = new Date();
  // Ajustamos restando 4 horas para UTC-4
  const boliviaTime = new Date(ahora.getTime() - 4 * 60 * 60 * 1000);
  return boliviaTime.toISOString();
}

// Guarda una venta en Supabase
// Guarda una venta en Supabase
async function guardarVenta() {
  if (!productoSeleccionado) {
    alert("Selecciona un producto primero.");
    return;
  }

  const nombre = document.getElementById("nombre").value;
  const direccion = document.getElementById("direccion").value;
  const telefono = document.getElementById("telefono").value;

  if (!nombre || !direccion || !telefono) {
    alert("Completa todos los campos.");
    return;
  }

  // En este caso asumimos que siempre se vende 1 unidad
  const cantidad = 1;
  const precioUnitario = productoSeleccionado.precio;
  const precioTotal = precioUnitario * cantidad;

  // ✅ Obtener el número consecutivo de venta
  const { count: totalVentas, error: countError } = await supabase
    .from('ventas')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    alert("Error al contar ventas: " + countError.message);
    return;
  }

  const numeroVenta = (totalVentas || 0) + 1;

  // Insertar la venta
  const { error } = await supabase
    .from('ventas')
    .insert([
      {
        bonsai_id: productoSeleccionado.id,
        codigo_bonsai: productoSeleccionado.codigo,
        nombre_cliente: nombre,
        direccion,
        telefono,
        fecha: obtenerFechaBoliviaISO(),
        precio_total_bonsai: precioTotal,
        numero_venta: numeroVenta // ✅ nuevo campo insertado
      }
    ]);

  if (error) {
    alert("Error guardando la venta: " + error.message);
    return;
  }

  cerrarModal('modalCompra');
  mostrarModal('modalMensaje');
  mostrarContadorVentas?.(); // opcional: actualiza el contador en pantalla si lo tienes



  cerrarModal('modalCompra');
  mostrarModal('modalMensaje');
}


// Descargar la imagen QR
function descargarQR() {
  const qrImg = document.getElementById("imagenQR");
  fetch(qrImg.src)
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-pago.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      cerrarModal('modalQR');
      cerrarModal('modalCompra');
      cerrarModal('modalCatalogo');
      cerrarModal('modalAdmin');
    })
    .catch(() => alert('Error al descargar el QR'));
}

// Validación de login admin
function validarLogin() {
  const usuario = document.getElementById("loginUsuario").value.trim();
  const contra = document.getElementById("loginContra").value.trim();

  if (usuario === "admin" && contra === "topo") {
    cerrarModal('modalLogin');
    mostrarModal('modalAdmin');
    document.getElementById("errorLogin").style.display = "none";
  } else {
    document.getElementById("errorLogin").style.display = "block";
  }
}

// Toggle para mostrar/ocultar contraseña
document.addEventListener("DOMContentLoaded", function () {
  cargarProductos();  // cargar productos al inicio

  const toggle = document.getElementById("togglePassword");
  const input = document.getElementById("loginContra");

  toggle.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggle.src = isPassword ? "icons8-eye-48.png" : "icons8-invisible-48.png";
  });
});
// Consulta el estado del pedido por código del bonsái
async function consultarEstadoPedido() {
  const codigo = document.getElementById('codigoPedido').value.trim();

  if (!codigo) {
    alert('Por favor ingresa el código del bonsái.');
    return;
  }

  const { data, error } = await supabase
    .from('ventas')
    .select('estado')
    .eq('codigo_bonsai', codigo)
    .order('fecha', { ascending: false })
    .limit(1);

  const contenedor = document.getElementById('seguimientoPedido');

  if (error || !data || data.length === 0) {
    contenedor.innerHTML = `<p style="color: red;">No se encontró el pedido o hubo un error.</p>`;
    return;
  }

  const estadoActual = data[0].estado.toLowerCase();

  const estados = [
    { nombre: 'preparando pedido', icono: '📦' },
    { nombre: 'en tránsito a la terminal', icono: '🚚' },
    { nombre: 'entregado', icono: '📬' }
  ];

  let html = '';
  let mostrarTodos = estadoActual === 'entregado';
  let estadoActualEncontrado = false;

  for (const estado of estados) {
    if (estado.nombre === estadoActual) {
      const conCheck = estadoActual === 'entregado' ? ' ✅' : '';
      html += `
        <div class="estado-linea actual">
          ${estado.icono} ${capitalizar(estado.nombre)}${conCheck}
        </div>
      `;
      if (!mostrarTodos) break;
      estadoActualEncontrado = true;
    }
else {
      html += `
        <div class="estado-linea completado">
          ${estado.icono} ${capitalizar(estado.nombre)} ✅
        </div>
      `;
    }
  }

  // Si estado final, mostrar mensaje
  if (estadoActual === 'entregado') {
    html += `
      <div class="mensaje-final">
        🌱 Tu arbolito podrá ser recogido mañana a partir de las 10:00 AM.
      </div>
    `;
  }

  contenedor.innerHTML = html;
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}



window.finalizarCompra = finalizarCompra;
window.mostrarModal = mostrarModal;
window.cerrarModal = cerrarModal;
window.verCatalogo = verCatalogo;
window.agregarProducto = agregarProducto;
window.validarLogin = validarLogin;
window.descargarQR = descargarQR;
window.consultarEstadoPedido = consultarEstadoPedido;
