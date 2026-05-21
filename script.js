let map, marker;
let selectorMap; // Variable para el mapa secundario
let selectorLayer; // Para mostrar el punto seleccionado
let lesionadosCount = 0;
let testigosCount = 0;

// Diccionario de coordenadas fijas (debe coincidir con recorridos.js)
const COORDENADAS_FIJAS = {
    "CONTROL-SAN-MARTIN-Y-5-ABRIL": [-32.985566, -68.782253],
    "CONTROL-TROPERO-Y-5-ABRIL": [-32.987591, -68.780913],
    "QUEDA-B-AMUPE": [-33.001162, -68.758262],
    "QUEDA-EST.GUTIERREZ": [-32.958955, -68.783622],
    "QUEDE-TERMINAL": [-32.895239, -68.830288],
    "CONTROL-RODEO": [-32.936751, -68.732997],
    "QUEDA-RECOARO": [-33.041453, -68.833136],
    "QUEDA-B-C.SOÑADA": [-33.034928, -68.765966],
    "CONTROL-CORRALITOS": [-32.859662, -68.662657]
};

const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');
const checkboxNoMapa = document.getElementById('no-mapa');
const mapDiv = document.getElementById('map');

function initMap() {
    map = L.map('map').setView([-32.931359, -68.803854], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    map.on('click', (e) => {
        if (mapDiv.style.pointerEvents !== 'none' && !checkboxNoMapa.checked) {
            actualizarMapa(e.latlng.lat, e.latlng.lng);
        }
    });
}

function actualizarMapa(lat, lng) {
    const pos = [lat, lng];
    map.setView(pos, 17);
    if (marker) marker.setLatLng(pos);
    else marker = L.marker(pos).addTo(map);
    document.getElementById('lat').value = lat.toFixed(6);
    document.getElementById('lng').value = lng.toFixed(6);
}

function gestionarBloqueo(fijo) {
    if (fijo) {
        mapDiv.style.pointerEvents = 'none';
        mapDiv.style.opacity = '0.6';
        mapDiv.classList.add('map-bloqueado');
        checkboxNoMapa.checked = false;
        checkboxNoMapa.disabled = true;
        checkboxNoMapa.parentElement.style.opacity = "0.5";
    } else {
        mapDiv.style.pointerEvents = 'auto';
        mapDiv.style.opacity = '1';
        mapDiv.classList.remove('map-bloqueado');
        checkboxNoMapa.disabled = false;
        checkboxNoMapa.parentElement.style.opacity = "1";
    }
}

// 1. Al hacer click/focus, se borra el contenido para mostrar el datalist
lineaInput.addEventListener('focus', function() {
    this.value = '';
    gestionarBloqueo(false);
    ramalContainer.style.display = 'none';
});

// 2. Lógica al seleccionar o escribir la línea
lineaInput.addEventListener('input', function() {
    const seleccion = this.value.trim();
    const grupo = grupoSelect.value;

    if (COORDENADAS_FIJAS[seleccion]) {
        actualizarMapa(COORDENADAS_FIJAS[seleccion][0], COORDENADAS_FIJAS[seleccion][1]);
        gestionarBloqueo(true);
    } else {
        gestionarBloqueo(false);
    }

    const puntos = DB_RECORRIDOS[grupo]?.recorridos[seleccion];
    if (puntos && puntos.length > 0) {
        ramalSelect.innerHTML = '<option value="">-- Seleccionar punto --</option>';
        puntos.forEach(p => {
            const opt = document.createElement('option');
            opt.textContent = p.replace(';', ' - ');
            opt.value = p;
            ramalSelect.appendChild(opt);
        });
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

grupoSelect.addEventListener('change', function() {
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    gestionarBloqueo(false);
    if (this.value && DB_RECORRIDOS[this.value]) {
        lineaInput.disabled = false;
        Object.keys(DB_RECORRIDOS[this.value].recorridos).forEach(rec => {
            const opt = document.createElement('option');
            opt.value = rec;
            datalistLineas.appendChild(opt);
        });
    } else {
        lineaInput.disabled = true;
    }
});

function toggleMapa(checked) {
    const container = document.getElementById('map-container');
    container.style.display = checked ? 'none' : 'block';
    if (!checked) {
        setTimeout(() => map.invalidateSize(), 200);
    } else {
        document.getElementById('lat').value = "0";
        document.getElementById('lng').value = "0";
    }
}

function cambiarLesionados(delta) {
    const contenedor = document.getElementById('lista-lesionados');
    const displayCount = document.getElementById('cant-lesionados');
    
    if (delta > 0) {
        lesionadosCount++;
        const div = document.createElement('div');
        div.className = 'lesionado-card';
        div.id = `les-${lesionadosCount}`;
        div.innerHTML = `
            <h4>Lesionado ${lesionadosCount}</h4>
            <div class="field-row">
                <input type="text" placeholder="Nombre completo">
                <input type="number" placeholder="DNI">
            </div>
            <div class="field-row" style="margin-top:5px;">
                <input type="text" placeholder="Domicilio">
                <input type="tel" placeholder="Teléfono">
            </div>
        `;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        document.getElementById(`les-${lesionadosCount}`).remove();
        lesionadosCount--;
    }
    displayCount.innerText = lesionadosCount;
}

function cambiarTestigos(delta) {
    // Usamos nombres de constantes específicos para esta función
    const contenedorTes = document.getElementById('testigos-lista');
    const displayTes = document.getElementById('cant-testigos');

    if (delta > 0) {
        testigosCount++;
        
        const divTes = document.createElement('div');
        divTes.className = 'testigo-card'; // Clase separada para CSS
        divTes.id = `tes-${testigosCount}`;

        const h4 = document.createElement('h4');
        h4.textContent = `Testigo ${testigosCount}`;
        divTes.appendChild(h4);

        // Fila 1
        const row1 = document.createElement('div');
        row1.className = 'field-row';
        const inNombre = document.createElement('input');
        inNombre.type = 'text';
        inNombre.placeholder = 'Nombre completo';
        const inDni = document.createElement('input');
        inDni.type = 'number';
        inDni.placeholder = 'DNI';
        row1.appendChild(inNombre);
        row1.appendChild(inDni);
        divTes.appendChild(row1);

        // Fila 2
        const row2 = document.createElement('div');
        row2.className = 'field-row';
        row2.style.marginTop = '5px';
        const inDom = document.createElement('input');
        inDom.type = 'text';
        inDom.placeholder = 'Domicilio';
        const inTel = document.createElement('input');
        inTel.type = 'tel';
        inTel.placeholder = 'Teléfono';
        row2.appendChild(inDom);
        row2.appendChild(inTel);
        divTes.appendChild(row2);

        contenedorTes.appendChild(divTes);
    } else if (testigosCount > 0) {
        const el = document.getElementById(`tes-${testigosCount}`);
        if (el) el.remove();
        testigosCount--;
    }

    if (displayTes) {
        displayTes.innerText = testigosCount;
    }
}



async function enviarWhatsApp() {
    // 1. Datos del Personal y Unidad
    const nombre = document.getElementById('chofer-nombre').value;
    const legajo = document.getElementById('chofer-legajo').value;
    const fecha = document.getElementById('siniestro-fecha').value;
    const hora = document.getElementById('siniestro-hora').value;
    const unidad = document.getElementById('unidad-numero').value;
    const patente = document.getElementById('unidad-patente').value;

    // 2. Datos de Recorrido y Ubicación
    const grupo = document.getElementById('grupo-select').value;
    const linea = document.getElementById('linea-input').value;
    const ramal = document.getElementById('ramal-select').value;
    const direccionManual = document.getElementById('siniestro-direccion').value;
    const sentido = document.getElementById('siniestro-sentido').value;
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const acta = document.getElementById('policia-datos').value;

    // 3. Datos del Tercero
    const tNombre = document.getElementById('tercero-nombre').value;
    const tDni = document.getElementById('tercero-dni').value;
    const tTel = document.getElementById('tercero-tel').value;
    const tDom = document.getElementById('tercero-domicilio').value;
    const tMarca = document.getElementById('tercero-marca').value;
    const tModelo = document.getElementById('tercero-modelo').value;
    const tDominio = document.getElementById('tercero-dominio').value;
    const tSeguro = document.getElementById('tercero-seguro').value;

    // 4. Relato
    const relato = document.getElementById('siniestro-relato').value;

    // 5. Procesar Lesionados dinámicamente
    let infoLesionados = "";
    const listaCards = document.querySelectorAll('.lesionado-card');
    
    if (listaCards.length > 0) {
        listaCards.forEach((card, index) => {
            const inputs = card.querySelectorAll('input');
            infoLesionados += `\n   - *Lesionado ${index + 1}:* ${inputs[0].value || 'S/D'}, DNI: ${inputs[1].value || 'S/D'}, Dirección: ${inputs[2].value || 'S/D'}, Tel: ${inputs[3].value || 'S/D'}`;
        });
    } else {
        infoLesionados = " Sin lesionados.";
    }

    // 5. Procesar Testigos dinámicamente
    let infotestigos = "";
    const listatest = document.querySelectorAll('.testigo-card');
    
    if (listatest.length > 0) {
        listatest.forEach((card, index) => {
            const inputs = card.querySelectorAll('input');
            infotestigos += `\n   - *Testigo ${index + 1}:* ${inputs[0].value || 'S/D'}, DNI: ${inputs[1].value || 'S/D'}, Dirección: ${inputs[2].value || 'S/D'}, Tel: ${inputs[3].value || 'S/D'}`;
        });
    } else {
        infotestigos = " Sin testigos.";
    }


    // CONSTRUCCIÓN DEL MENSAJE
    let mensaje = `⚠️ INFORME DE SINIESTRO\n`;
    mensaje += `------------------------------------------\n`;
    mensaje += `• Chofer: ${nombre}\n`;
    mensaje += `• Legajo: ${legajo}\n`;
    mensaje += `• Unidad: ${unidad}\n`;
    mensaje += `• Patente: ${patente}\n`;
    mensaje += `• Fecha: ${fecha}\n`;
    mensaje += `• Hora:${hora}hs\n\n`;

    mensaje += `• Grupo: ${grupo}\n`;
    mensaje += `• Recorrido: ${linea}\n`;
    mensaje += `• Sentido: ${sentido}\n`;
    mensaje += `• Lugar: ${direccionManual};${ramal};${lat}, ${lng}\n`;
    mensaje += `• Policía/Acta: ${acta}\n\n`;

    mensaje += `TERCERO INVOLUCRADO\n`;
    mensaje += `• Nombre: ${tNombre} DNI: ${tDni}\n`;
    mensaje += `• Dirección: ${tDom} Teléfono: ${tTel}\n`;
    mensaje += `• Vehículo: ${tMarca} ${tModelo} Patente: ${tDominio} Seguro/Póliza: ${tSeguro}\n\n`;

    mensaje += `LESIONADOS (${lesionadosCount}):${infoLesionados}\n\n`;

    mensaje += `TESTIGOS (${testigosCount}):${infotestigos}\n\n`;

    mensaje += `RELATO: ${relato}\n\n`;
    
    mensaje += `MAPA: https://www.google.com/maps?q=${lat},${lng}`;






    // Envío
    // LÓGICA DE SELECCIÓN DE TELÉFONO
    let nroTelefono = "";

    // Validamos según lo seleccionado en el id 'grupo-select'
    if (grupo === "G200") {
        nroTelefono = "5492612039225"; // Reemplaza con el número para el Grupo 200
    } else if (grupo === "G800") {
        nroTelefono = "5492612013938"; // Reemplaza con el número para el Grupo 800
    } else {
        // Opción por defecto o alerta si no hay selección válida
        alert("Por favor, seleccione un grupo válido para enviar el reporte.");
        return; 
    }

    // Envío final
    const url = `https://wa.me/${nroTelefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');

// --- ENVÍO A GOOGLE SHEETS (Versión Optimizada) ---
const urlPlanilla = "https://script.google.com/macros/s/AKfycbyGKvEnU00Azhmt5YVilokk4fM94FL7OngVs-R0Ctr1LCXN1ksDpG6FZch8mzksww2I/exec";

// Usamos URLSearchParams para que los datos viajen como campos de formulario
const formData = new URLSearchParams();
formData.append('fecha', fecha);
formData.append('hora', hora);
formData.append('chofer', nombre);
formData.append('legajo', legajo);
formData.append('unidad', unidad);
formData.append('patente', patente);
formData.append('grupo', grupo);
formData.append('linea', linea);
formData.append('lugar', `${direccionManual} ;${ramal};${lat}, ${lng} -Sentido: ${sentido} -Acta: ${acta}`);
formData.append('tercero', `${tNombre} DNI: ${tDni}, Tel: ${tTel}, Dirección: ${tDom}, Vehículo: ${tMarca} ${tModelo}, Patente: ${tDominio}, Seguro/Póliza: ${tSeguro}`);
formData.append('lesionados', infoLesionados);
formData.append('testigos', infotestigos);
formData.append('relato', relato);

try {
    await fetch(urlPlanilla, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
    });
    console.log("Petición enviada a la planilla");
} catch (e) {
    console.error("Error al guardar en Sheet", e);
}

// --- ENVÍO A GOOGLE SHEETS (Versión Optimizada) ---
}



function verificarClave() {
    const claveIngresada = document.getElementById('clave-input').value;
    const pantalla = document.getElementById('bloqueo-pantalla');
    const errorMsg = document.getElementById('error-msg');
    
    // Aquí defines tu clave
    const claveCorrecta = "m789"; 

    if (claveIngresada === claveCorrecta) {
        pantalla.style.display = 'none'; // Oculta el bloqueo
        // Opcional: Guardar en la sesión para que no pida clave todo el tiempo
        sessionStorage.setItem('autorizado', 'true');
    } else {
        errorMsg.style.display = 'block'; // Muestra error
        document.getElementById('clave-input').value = ""; // Limpia el input
    }
}



// Al cargar la página, revisar si ya estaba autorizado
window.onload = function() {
    if (sessionStorage.getItem('autorizado') === 'true') {
        document.getElementById('bloqueo-pantalla').style.display = 'none';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    initMap();
    document.getElementById('siniestro-fecha').valueAsDate = new Date();
});

