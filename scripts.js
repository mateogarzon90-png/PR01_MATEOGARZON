// Usamos un objeto para encapsular todo el juego
const JuegoGuardianes = {
    puntos: 0,
    activo: false,
    timeoutBrisa: null, 
    velocidad: 2000,    
    silenciado: false,       // Estado global del sonido (false = suena, true = mudo)
    multiplicadorNieve: 1,   // NUEVO: Factor global para controlar la velocidad de los copos

    // 1. Inicializar el juego, audios y efectos visuales
    init: function() {
        this.velas = document.querySelectorAll('#juego-reflejos .item-vela');
        this.marcador = document.getElementById('velitas-puntos');
        
        // Elementos de las pantallas modales
        this.pantallaInicio = document.getElementById('pantalla-inicio');
        this.pantallaFinal = document.getElementById('pantalla-final');
        this.puntosFinalesTexto = document.querySelector('#pantalla-final .puntos-finales span');
        
        // Botones
        this.btnComenzar = document.getElementById('btn-comenzar');
        this.btnReiniciar = document.getElementById('btn-reiniciar');
        this.btnMute = document.getElementById('btn-mute'); 

        // Configuración de audio nativa
        this.audioFondo = new Audio('sonidos/winterlight.mp3');
        this.audioViento = new Audio('sonidos/softwind.mp3');
        this.audioEncender = new Audio('sonidos/lighting.mp3');

        this.audioFondo.loop = true;
        this.audioViento.loop = true;

        this.audioFondo.volume = 0.3;   
        this.audioViento.volume = 0.4;  
        this.audioEncender.volume = 0.8; 
        
        this.agregarEventos();
        
        this.activo = false;
        this.actualizarMarcador();

        // Arrancamos la nevada mágica en el escenario
        this.crearNevada();
    },

    // 2. Escuchar los clics del usuario y botones
    agregarEventos: function() {
        this.velas.forEach(vela => {
            vela.addEventListener('click', () => {
                if (this.activo && vela.classList.contains('apagada')) {
                    this.encenderVela(vela);
                }
            });
        });

        // Botón de la pantalla de Bienvenida
        this.btnComenzar.addEventListener('click', () => {
            this.reproducirAmbiente(); 
            this.comenzarJuego();
        });

        // Botón de la pantalla de agradecimiento final
        this.btnReiniciar.addEventListener('click', () => {
            this.comenzarJuego(); 
        });

        // Evento para el botón de Mute / Silencio
        this.btnMute.addEventListener('click', () => {
            this.alternarSilencio();
        });
    },

// Controla el estado mudo de todos los canales a la vez cambiando los iconos SVG
    alternarSilencio: function() {
        this.silenciado = !this.silenciado; 

        this.audioFondo.muted = this.silenciado;
        this.audioViento.muted = this.silenciado;
        this.audioEncender.muted = this.silenciado;

        // Seleccionamos ambos dibujos vectoriales
        const iconoOn = this.btnMute.querySelector('.icono-audio-on');
        const iconoOff = this.btnMute.querySelector('.icono-audio-off');

        if (this.silenciado) {
            this.btnMute.classList.add('silenciado');
            iconoOn.classList.add('oculto');    // Oculta el altavoz con ondas
            iconoOff.classList.remove('oculto'); // Muestra el altavoz con la X
        } else {
            this.btnMute.classList.remove('silenciado');
            iconoOn.classList.remove('oculto'); // Muestra el altavoz con ondas
            iconoOff.classList.add('oculto');    // Oculta el altavoz con la X
        }
    },

    reproducirAmbiente: function() {
        this.audioFondo.currentTime = 0;
        this.audioViento.currentTime = 0;
        
        this.audioFondo.play().catch(e => console.log("Audio de fondo esperando interacción"));
        this.audioViento.play().catch(e => console.log("Audio de viento esperando interacción"));
    },

    encenderVela: function(vela) {
        vela.classList.remove('apagada');
        vela.classList.add('encendida');
        
        this.audioEncender.currentTime = 0;
        this.audioEncender.play().catch(e => console.log("Error al reproducir sonido"));

        this.puntos += 10;
        this.actualizarMarcador();
        
        const todasEncendidas = Array.from(this.velas).every(v => v.classList.contains('encendida'));
        if (todasEncendidas && this.timeoutBrisa === null) {
            setTimeout(() => {
                this.bucleDeViento();
            }, 600);
        }
    },

    // 3. La lógica del juego y reinicios
    comenzarJuego: function() {
        this.reproducirAmbiente();

        // INTENTO DE PANTALLA COMPLETA EN MÓVILES:
        // Si es un dispositivo móvil, expande el juego para eliminar las barras del navegador
        const contenedorCompleto = document.documentElement;
        if (contenedorCompleto.requestFullscreen) {
            contenedorCompleto.requestFullscreen().catch(e => console.log("Pantalla completa esperando permiso"));
        } else if (contenedorCompleto.webkitRequestFullscreen) { /* Safari / iOS */
            contenedorCompleto.webkitRequestFullscreen();
        }
        
        // CORRECCIÓN: Reseteamos el multiplicador de la nieve al empezar (1 = velocidad base)
        this.multiplicadorNieve = 1;
        
        clearTimeout(this.timeoutBrisa);
        this.timeoutBrisa = null;
        
        this.activo = true;
        this.puntos = 0;
        this.velocidad = 2000; 
        this.actualizarMarcador();

        this.pantallaInicio.classList.add('oculto');
        this.pantallaFinal.classList.add('oculto');

        this.velas.forEach(vela => {
            vela.classList.remove('encendida');
            vela.classList.add('apagada');
        });
    },

    bucleDeViento: function() {
        if (!this.activo) return; 

        this.timeoutBrisa = setTimeout(() => {
            if (!this.activo) return; 
            this.soploBrisa();
        }, this.velocidad);
    },

    soploBrisa: function() {
        const velasEncendidas = Array.from(this.velas).filter(v => v.classList.contains('encendida'));
        
        if (velasEncendidas.length > 0) {
            const azar = Math.floor(Math.random() * velasEncendidas.length);
            const velaParaApagar = velasEncendidas[azar];
            
            velaParaApagar.classList.remove('encendida');
            velaParaApagar.classList.add('apagada');

            // Tu calibración perfecta: -30ms por soplido hasta un tope de 600ms
            if (this.velocidad > 600) {
                this.velocidad -= 30; 
                console.log("Nueva velocidad del viento: " + this.velocidad + "ms");
                
                // CORRECCIÓN: Guardamos el factor de aceleración de forma interna y limpia
                this.multiplicadorNieve = 0.5 + ((this.velocidad - 600) / 1400) * 0.5;
            }

            // Margen de gracia de medio segundo (500ms) para que el niño pueda salvar la partida
            setTimeout(() => {
                if (!this.activo) return;

                const comprobarSiQuedan = Array.from(this.velas).some(v => v.classList.contains('encendida'));
                
                if (!comprobarSiQuedan) {
                    this.gameOver();
                } else {
                    this.bucleDeViento();
                }
            }, 500); 

        } else {
            setTimeout(() => {
                const comprobarSiQuedan = Array.from(this.velas).some(v => v.classList.contains('encendida'));
                if (!comprobarSiQuedan) this.gameOver();
                else this.bucleDeViento();
            }, 500);
        }
    },

    actualizarMarcador: function() {
        this.marcador.innerText = this.puntos;
    },

    gameOver: function() {
        this.activo = false;                
        clearTimeout(this.timeoutBrisa);    
        this.timeoutBrisa = null;

        this.audioFondo.pause();
        this.audioViento.pause();
        
        this.puntosFinalesTexto.innerText = this.puntos;
        this.pantallaFinal.classList.remove('oculto');
    },

    // Generador continuo de copos de nieve (Calibrado para el hueco de la ventana)
    crearNevada: function() {
        const contenedor = document.getElementById('juego-reflejos');
        
        setInterval(() => {
            if (document.hidden) return;

            const copo = document.createElement('div');
            copo.classList.add('copo-nieve');

            const tamano = Math.random() * 4 + 2;
            copo.style.width = `${tamano}px`;
            copo.style.height = `${tamano}px`;

            copo.style.top = '30px'; 

            const aleatorioX = Math.random() * 35; 
            copo.style.left = `calc(30px + ${aleatorioX}%)`;

            // Duración base aleatoria del copo
            const duracionBase = Math.random() * 3 + 3.5; 
            
            // CORRECCIÓN SEGURO-ANTI-ERRORES: Multiplicamos el tiempo base por el factor actual.
            // Si no se ha definido aún (antes de empezar), por defecto toma 1.
            const duracionFinal = duracionBase * (this.multiplicadorNieve || 1); 
            
            const retraso = Math.random() * 3;
            copo.style.animationDuration = `${duracionFinal}s`;
            copo.style.animationDelay = `${-retraso}s`; 

            copo.style.opacity = Math.random() * 0.6 + 0.3;

            contenedor.appendChild(copo);

            setTimeout(() => {
                copo.remove();
            }, duracionFinal * 1000);

        }, 140); 
    }
};

// Arrancamos el juego cuando cargue el archivo
JuegoGuardianes.init();