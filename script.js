// script.js
document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------
    // 1. INICIALIZACIÓN Y DIAGNÓSTICO
    // ----------------------------------------------------
    // Esta es la línea 5, y si 'db' ya existe, el código continúa.
    if (typeof db === 'undefined') {
        console.error("🔴 ERROR CRÍTICO: La variable 'db' (Firestore) no está definida.");
        console.warn("   -> Asegúrate de que index.html cargue los SDKs de Firebase y la configuración antes de script.js.");
        return; 
    }

    const form = document.getElementById('form-ofrenda');
    const inputNombre = document.getElementById('input-nombre');
    const inputUrl = document.getElementById('input-url');
    const altarContainer = document.getElementById('altar-container');
    const floresEmojis = ['🌼', '🌸', '🌺', '🌻', '🌷', '🏵️'];

    // Función para obtener 2 flores aleatorias para la base
    function seleccionarFloresBase() {
        const flor1 = floresEmojis[Math.floor(Math.random() * floresEmojis.length)];
        const flor2 = floresEmojis[Math.floor(Math.random() * floresEmojis.length)];
        return { flor1, flor2 };
    }

    // Función que genera el HTML de una sola tarjeta de ofrenda
    function crearTarjetaOfrenda(ofrenda) {
        const { flor1, flor2 } = seleccionarFloresBase();
        
        // Imagen de respaldo si la URL falla (como se sugirió antes)
        const placeholderImg = 'https://via.placeholder.com/300x200?text=IMAGEN+NO+DISPONIBLE';

        return `
            <div class="ofrenda-card">
                
                <p class="nombre-difunto">${ofrenda.nombre || 'Nombre Desconocido'}</p>
                
                <div class="foto-container">
                    <img 
                        src="${ofrenda.url}" 
                        alt="Recuerdo de ${ofrenda.nombre}"
                        onerror="this.onerror=null; this.src='${placeholderImg}';"
                    >
                </div>
                
                <div class="veladora-container">
                    <span class="flor-emoji-base flor-izquierda">${flor1}</span>
                    <div class="veladora">
                        <div class="flama"></div>
                    </div>
                    <span class="flor-emoji-base flor-derecha">${flor2}</span>
                </div>

            </div>
        `;
    }

    // Función que pinta todas las ofrendas en el contenedor
    function renderAltar(ofrendas) {
        altarContainer.innerHTML = '';
        console.log(`✅ Datos recibidos de Firestore. Total de ofrendas: ${ofrendas.length}`);

        if (ofrendas.length === 0) {
            altarContainer.innerHTML = '<p style="color:white; font-size:1.2em;">Aún no hay ofrendas. Sé el primero en colocar una.</p>';
            return;
        }

        ofrendas.forEach(ofrenda => {
            const tarjetaHTML = crearTarjetaOfrenda(ofrenda);
            altarContainer.innerHTML += tarjetaHTML;
        });
    }

    // ----------------------------------------------------
    // 2. LECTURA DE DATOS (ON SNAPSHOT)
    // ----------------------------------------------------
    db.collection("ofrendas")
        .orderBy("timestamp", "desc")
        .onSnapshot((querySnapshot) => {
            const ofrendas = [];
            
            // Si hay un error, el 'querySnapshot' podría estar vacío o fallar, 
            // pero si llega hasta aquí, al menos hubo una respuesta.
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Omitir documentos que son solo el timestamp pendiente
                if (data.nombre && data.url) { 
                     ofrendas.push(data);
                }
            });

            // Llama a la función que pinta las tarjetas
            renderAltar(ofrendas);
            
        }, (error) => {
             // Esto se ejecuta si la lectura es bloqueada (e.g., Reglas de Seguridad)
             console.error("❌ ERROR DE FIREBASE AL LEER DATOS:", error.message);
             altarContainer.innerHTML = `<p style="color:red;">Error de conexión: ${error.message}</p>`;
        });


    // ----------------------------------------------------
    // 3. ESCRITURA DE DATOS (SUBMIT DEL FORMULARIO)
    // ----------------------------------------------------
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        // Verifica que la URL parezca válida
        if (!inputUrl.value.startsWith('http')) {
             alert('Por favor, ingresa una URL válida para la foto (debe empezar con http/https).');
             return;
        }

        const nuevaOfrenda = {
            nombre: inputNombre.value,
            url: inputUrl.value,
            // Agregamos un campo de timestamp para ordenar
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection("ofrendas").add(nuevaOfrenda);
            console.log("Ofrenda agregada con éxito a Firebase. La página se actualizará automáticamente.");
            form.reset();
        } catch (error) {
            console.error("Error al añadir la ofrenda: ", error);
            alert("Hubo un error al subir la ofrenda. Revisa la consola.");
        }
    });

    // ----------------------------------------------------
    // 4. EVENTOS LOCALES (Veladora)
    // ----------------------------------------------------
    altarContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('veladora')) {
            e.target.classList.toggle('encendida');
        }
    });

});

