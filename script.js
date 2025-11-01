document.addEventListener('DOMContentLoaded', () => {

    // ** ATENCIÓN: Asegúrate de que 'db' esté definido en tu index.html (Paso 1) **
    if (typeof db === 'undefined') {
        console.error("Firebase no se ha inicializado correctamente. Revisa el Paso 1.");
        return;
    }

    const form = document.getElementById('form-ofrenda');
    const inputNombre = document.getElementById('input-nombre');
    const inputUrl = document.getElementById('input-url');
    const altarContainer = document.getElementById('altar-container');
    const floresEmojis = ['🌼', '🌸', '🌺', '🌻', '🌷', '🏵️'];

    function seleccionarFloresBase() {
        const flor1 = floresEmojis[Math.floor(Math.random() * floresEmojis.length)];
        const flor2 = floresEmojis[Math.floor(Math.random() * floresEmojis.length)];
        return { flor1, flor2 };
    }

    // *** FUNCIÓN DE RENDERIZADO ACTUALIZADA PARA FIREBASE ***
    function renderOfrendas(ofrendas) {
        altarContainer.innerHTML = '';

        // El array de ofrendas viene directamente de Firebase
        ofrendas.forEach(ofrenda => {
            const { flor1, flor2 } = seleccionarFloresBase();
            
            // Creamos la tarjeta usando los datos de Firebase
            const tarjetaHTML = `
                <div class="ofrenda-card">
                    <p class="nombre-difunto">${ofrenda.nombre}</p>
                    <div class="foto-container">
                        <img src="${ofrenda.url}" alt="Recuerdo de ${ofrenda.nombre}">
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
            altarContainer.innerHTML += tarjetaHTML;
        });
    }


    // *** 1. ESCUCHANDO CAMBIOS EN TIEMPO REAL (LECTURA) ***
    // Firestore te permite "escuchar" la colección,
    // por lo que cada vez que alguien añade una ofrenda,
    // la página de todos se actualiza automáticamente.

    // Ordenamos por fecha de creación (timestamp) de forma descendente.
    // Necesitarás un índice en Firestore llamado 'timestamp'
    db.collection("ofrendas")
        .orderBy("timestamp", "desc")
        .onSnapshot((querySnapshot) => {
            const ofrendas = [];
            querySnapshot.forEach((doc) => {
                // Añadimos los datos de la ofrenda al array
                ofrendas.push(doc.data());
            });
            // Llamamos al renderizado con los datos frescos de Firebase
            renderOfrendas(ofrendas);
        });


    // *** 2. ENVIANDO DATOS A FIREBASE (ESCRITURA) ***
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const nuevaOfrenda = {
            nombre: inputNombre.value,
            url: inputUrl.value,
            // Agregamos un campo de timestamp para ordenar
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Guardamos la nueva ofrenda en la colección "ofrendas"
            await db.collection("ofrendas").add(nuevaOfrenda);
            console.log("Ofrenda agregada con éxito a Firebase.");
            form.reset();
        } catch (error) {
            console.error("Error al añadir la ofrenda: ", error);
            alert("Hubo un error al subir la ofrenda. Revisa la consola.");
        }
    });

    // Escuchamos clics para encender veladoras (Mantenemos la lógica local)
    altarContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('veladora')) {
            e.target.classList.toggle('encendida');
        }
    });

    // Eliminamos el array de ofrendas de ejemplo (se cargan desde Firebase)
});