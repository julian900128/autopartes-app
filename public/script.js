document.addEventListener('DOMContentLoaded', () => {

    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');
    const mainSection = document.querySelector('main');
    const productDetail = document.getElementById('productDetail');
    const closeDetailBtn = document.getElementById('closeDetail');

    // Función para obtener productos de la API
    async function cargarProductos(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await fetch(`/api/productos?${params}`);
            const productos = await response.json();
            render(productos);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            productGrid.innerHTML = '<p class="col-span-3 text-center text-red-500">Error al conectar con el servidor.</p>';
        }
    }

    // Renderizar tarjetas en el DOM
    function render(productos) {
        productGrid.innerHTML = '';
        if (productos.length === 0) {
            productGrid.innerHTML = '<p class="col-span-3 text-center text-gray-500">No se encontraron repuestos.</p>';
            return;
        }

        productos.forEach(p => {
            console.log('Producto:', p.id, p.nombre);
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg shadow-md border hover:border-blue-500 transition-all cursor-pointer';
            card.setAttribute('data-id', p.id);
            // card.innerHTML = `
            //     <img src="/images/${p.imagen_url || 'placeholder.jpg'}" alt="${p.nombre}" class="w-full h-48 object-contain mb-4">
            //     <span class="text-xs font-bold text-blue-600 uppercase">${p.categoria}</span>
            //     <h3 class="font-bold text-lg mb-1">${p.nombre}</h3>
            //     <p class="text-gray-500 text-sm mb-3">Compatible con: ${p.modelo_auto} (${p.año})</p>
            // `;
            card.innerHTML = `
            <img src="/images/${p.imagen_url || 'placeholder.jpg'}" alt="${p.nombre}" class="w-full h-48 object-contain mb-4">
            <span class="text-xs font-bold text-blue-600 uppercase">${p.categoria || 'General'}</span>
            <h3 class="font-bold text-lg mb-1">${p.nombre}</h3>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${p.descripcion || 'Sin descripción adicional'}</p>
        `;
            card.addEventListener('click', () => {
                console.log('Clic en tarjeta con ID:', p.id);
                history.pushState({ id: p.id }, '', `/producto/${p.id}`);
                mostrarDetalle(p.id);
            });
            productGrid.appendChild(card);
        });
    }

    // Eventos para filtros con debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchValue = e.target.value.trim();
        
        if (searchValue === '') {
            // Si el campo está vacío, cargar todos los productos
            cargarProductos();
        } else {
            // Si hay texto, esperar 300ms antes de buscar
            searchTimeout = setTimeout(() => {
                cargarProductos({ q: searchValue });
            }, 300);
        }
    });

    // Carga inicial
    cargarProductos().then(() => {
        handleInitialRoute();
    });

    window.addEventListener('popstate', (event) => {
        const state = event.state;
        if (state && state.id) {
            mostrarDetalle(state.id);
        } else {
            productDetail.classList.add('hidden');
            mainSection.classList.remove('hidden');
            history.replaceState(null, '', '/');
        }
    });

    function handleInitialRoute() {
        const path = window.location.pathname;
        if (path.startsWith('/producto/')) {
            const id = path.split('/producto/')[1];
            if (id) {
                mostrarDetalle(id);
                history.replaceState({ id }, '', path);
            }
        }
    }

    // Función para mostrar detalle del producto
    async function mostrarDetalle(id) {
        console.log('Mostrando detalle para ID:', id);
        try {
            const response = await fetch(`/api/productos/${id}`);
            console.log('Respuesta del fetch:', response);
            const producto = await response.json();
            console.log('Producto obtenido:', producto);
            
            const detailContent = document.getElementById('detailContent');
            // detailContent.innerHTML = `
            //     <div class="bg-white p-4 rounded-lg shadow-md border max-w-md mx-auto">
            //         <img src="/images/${producto.imagen_url || 'placeholder.jpg'}" alt="${producto.nombre}" class="w-full h-48 object-contain mb-4">
            //         <span class="text-xs font-bold text-blue-600 uppercase">${producto.categoria}</span>
            //         <h3 class="font-bold text-lg mb-1">${producto.nombre}</h3>
            //         <p class="text-gray-500 text-sm mb-3">Compatible con: ${producto.modelo_auto} (${producto.año})</p>
            //     </div>
            // `;
            detailContent.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-md border max-w-2xl mx-auto">
                    <img src="/images/${producto.imagen_url || 'placeholder.jpg'}" alt="${producto.nombre}" class="w-full h-64 object-contain mb-6">
                    <div class="space-y-2">
                        <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">${producto.categoria || 'Repuesto'}</span>
                        <h3 class="font-bold text-2xl mb-2 text-gray-800">${producto.nombre}</h3>
                        
                        <div class="border-t pt-4 mt-4">
                            <p class="text-gray-900 font-semibold mb-2">Descripción del Producto:</p>
                            <p class="text-gray-600 leading-relaxed">${producto.descripcion || 'Este producto no tiene una descripción detallada todavía.'}</p>
                        </div>
                    </div>
                </div>
            `;
            mainSection.classList.add('hidden');
            productDetail.classList.remove('hidden');
            console.log('Detalle mostrado');
        } catch (error) {
            console.error('Error al cargar detalle:', error);
        }
    }

    // Evento para cerrar detalle
    closeDetailBtn.addEventListener('click', () => {
        productDetail.classList.add('hidden');
        mainSection.classList.remove('hidden');
        history.pushState(null, '', '/');
    });
});