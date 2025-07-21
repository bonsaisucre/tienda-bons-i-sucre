// script.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://zjtdiracprhqhetxpnou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdGRpcmFjcHJocWhldHhwbm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MjU2OTUsImV4cCI6MjA2NzUwMTY5NX0.A9yKjvSSQVsjAGKWbLa9wTTiez5sm8uPvSZ9bNoLB6w';

const supabase = createClient(supabaseUrl, supabaseKey);


let productos = [];
let productoSeleccionado = null;
let carrito = [];

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
function agregarProductoAlCarrito() {
  if (!productoSeleccionado) return;

  if (!carrito.find(p => p.id === productoSeleccionado.id)) {
    carrito.push(productoSeleccionado);
    alert(`${productoSeleccionado.nombre} agregado al carrito`);
    document.getElementById("btnVerCarrito").classList.remove("oculto");
  } else {
    alert(`${productoSeleccionado.nombre} ya está en el carrito`);
  }

  cerrarModal('modalCatalogo');
}
function limpiarCarrito() {
  carrito = [];
  document.getElementById("btnVerCarrito").classList.add("oculto");
}

function mostrarCarrito() {
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const lista = carrito.map(p => `<li>${p.nombre} - ${p.precio} Bs</li>`).join('');
  const total = carrito.reduce((sum, p) => sum + p.precio, 0);

  document.getElementById("carritoLista").innerHTML = `
    <ul>${lista}</ul>
    <p><strong>Total:</strong> ${total} Bs</p>
    <button onclick="mostrarModal('modalCompra')">Finalizar Compra</button>
  `;

  mostrarModal("modalCarrito"); // puedes tener un modal especial, o reusar uno
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

// Función auxiliar para saber si hay modales abiertos
function hayModalesAbiertos() {
  const modales = document.querySelectorAll('.modal');
  return Array.from(modales).some(modal => modal.style.display === 'flex');
}

// Mostrar un modal y ocultar el botón "rastrear pedido"
function mostrarModal(id) {
  // Cerrar todos los modales visibles excepto el que vamos a abrir
  const modalesAbiertos = document.querySelectorAll('.modal');
  modalesAbiertos.forEach(modal => {
    if (modal.id !== id && modal.style.display === 'flex') {
      modal.style.display = 'none';
      modal.classList.remove('mostrar');
      modal.classList.remove('ocultando');
    }
  });

  if (id === 'modalQR') {
    document.getElementById('imagenQR').src = 'IMG-20250625-WA0012.jpg';
  }

  if (id === 'modalCompra') {
    document.getElementById("nombre").value = "";
    document.getElementById("direccion").value = "";
    document.getElementById("telefono").value = "";
  }

  if (id === 'modalVerPedido') {
    document.getElementById('codigoPedido').value = '';
    document.getElementById('seguimientoPedido').innerHTML = '';
  }

  const modal = document.getElementById(id);
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("mostrar");
  }, 10);

  // Oculta el botón rastrear pedido
  const btn = document.getElementById('btnVerPedido');
  if (btn) btn.classList.add('oculto');

  document.getElementById('btnAdmin').classList.add('ocultar');
}
function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return; // por si no existe

  modal.classList.remove("mostrar");
  modal.classList.add("ocultando");

  setTimeout(() => {
    modal.style.display = "none";
    modal.classList.remove("ocultando");

    // Mostrar botón rastrear pedido solo si no hay modales abiertos
    if (!hayModalesAbiertos()) {
      const btn = document.getElementById('btnVerPedido');
      if (btn) btn.classList.remove('oculto');
    }
  }, 700);

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
function generarCodigoRastreo() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numeros = "0123456789";
  const aleatorio = () => 
    letras[Math.floor(Math.random() * letras.length)] + 
    numeros[Math.floor(Math.random() * numeros.length)] + 
    letras[Math.floor(Math.random() * letras.length)];

  return "BONSAI-" + aleatorio() + "-" + Date.now().toString().slice(-4);
}

// Guarda una venta en Supabase
async function guardarVenta() {
  // Si el carrito está vacío pero hay productoSeleccionado, lo usamos
  let itemsVenta = [...carrito];
  if (itemsVenta.length === 0 && productoSeleccionado) {
    itemsVenta = [productoSeleccionado];
  }

  if (itemsVenta.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const telefono = document.getElementById("telefono").value.trim();

  if (!nombre || !direccion || !telefono) {
    alert("Completa todos los campos.");
    return;
  }

  const { count: totalVentas, error: countError } = await supabase
    .from('ventas')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    alert("Error al contar ventas: " + countError.message);
    return;
  }

  const numeroVenta = (totalVentas || 0) + 1;

  const codigos = itemsVenta.map(p => p.codigo).join(', ');
  const totalBonsais = itemsVenta.length;
  const precioTotal = itemsVenta.reduce((sum, p) => sum + p.precio, 0);
  const fecha = obtenerFechaBoliviaISO();
  // Ya tienes todos los datos necesarios aquí (nombre, direccion, telefono, codigos, etc.)

  const codigoGenerado = generarCodigoRastreo();  // ✅ Generamos el código de rastreo

  const { error } = await supabase
    .from('ventas')
    .insert([
      {
        nombre_cliente: nombre,
        direccion,
        telefono,
        fecha,
        numero_venta: numeroVenta,
        codigo_de_busqueda: codigos,
        total_bonsais: totalBonsais,
        precio_total: precioTotal,
        codigo_de_rastreo_cliente: codigoGenerado  // ✅ Guardamos el código en la nueva columna
      }
    ]);

  if (error) {
    alert("Error guardando la venta: " + error.message);
    return;
  }

  // Enviar datos a Pipedream webhook
  await fetch("https://eojva0qdtf9wnnq.m.pipedream.net", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombre_cliente: nombre,
      telefono: telefono,
      direccion: direccion,
      codigos: codigos,
      total: precioTotal,
      codigo_rastreo: codigoGenerado,
      fecha: fecha
    })
  });

  cerrarModal('modalCompra');
  mostrarModal('modalMensaje');
  limpiarCarrito();

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
      cerrarModal('modalCarrito');

        // ✅ Volver a vista tienda y vaciar carrito
        limpiarCarrito();
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
  const codigoInput = document.getElementById('codigoPedido').value.trim();
  const contenedor = document.getElementById('seguimientoPedido');

  if (!codigoInput) {
    alert('Por favor ingresa el código de rastreo.');
    return;
  }

  // Buscar la venta por el código_de_rastreo_cliente
  const { data, error } = await supabase
    .from('ventas')
    .select('estado')
    .eq('codigo_de_rastreo_cliente', codigoInput)
    .order('fecha', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    contenedor.innerHTML = `<p style="color: red;">todavia no estan preparando tu pedido.</p>`;
    return;
  }

  const estadoActual = data[0].estado.toLowerCase();

  const estados = [
    { nombre: 'preparando pedido', icono: '📦', texto: 'Preparado pedido' },
    { nombre: 'en tránsito a la terminal', icono: '🚚', texto: 'En tránsito a la terminal' },
    { nombre: 'entregado', icono: '📬', texto: 'Entregado a la empresa de envío' }
  ];

  const indiceActual = estados.findIndex(e => e.nombre === estadoActual);
  let html = `<div class="progreso-envio pasos-${indiceActual + 1}">`;

  for (let i = 0; i <= indiceActual; i++) {
    const estado = estados[i];
    const esFinal = estadoActual === 'entregado';

    const clasePaso = i < indiceActual || esFinal ? 'completado' : 'actual';
    const check = i < indiceActual || esFinal
      ? '<img src="https://img.icons8.com/?size=100&id=63262&format=png&color=000000" alt="check" class="check-icon">'
      : '';

    html += `
      <div class="paso ${clasePaso}">
        <div class="icono-paso">${estado.icono}</div>
        <p>${estado.texto}</p>
      </div>
    `;

    if (i < indiceActual) {
      html += `
        <div class="conector">
          <span class="check">${check}</span>
        </div>
      `;
    }
  }

  html += '</div>';

  if (estadoActual === 'entregado') {
    html += `
      <div class="mensaje-final">
         Tu arbolito podrás recogerlo mañana a partir de las 10:00 AM. en la terminal de la empresa de envío.
      </div>
    `;
  }

  contenedor.innerHTML = html;
}


  window.finalizarCompra = finalizarCompra;
  window.mostrarModal = mostrarModal;
  window.cerrarModal = cerrarModal;
  window.verCatalogo = verCatalogo;
  window.agregarProducto = agregarProducto;
  window.validarLogin = validarLogin;
  window.descargarQR = descargarQR;
  window.consultarEstadoPedido = consultarEstadoPedido;
  window.agregarProductoAlCarrito = agregarProductoAlCarrito
  window.mostrarCarrito = mostrarCarrito
window.limpiarCarrito =limpiarCarrito
