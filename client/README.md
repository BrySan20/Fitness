# Fitness Tracker PWA


Aplicación Web Progresiva (PWA) desarrollada como caso de estudio académico. Esta app permite registrar y consultar datos de actividad física, soporta funcionamiento offline, vistas generadas en cliente/servidor y uso de elementos físicos del dispositivo.


---


## ⚙️ ¿Cómo funciona?


1. **Pantalla de inicio (Splash y Home):**
- Al abrir la app, se muestra una pantalla de carga (Splash) con el logo de la aplicación.
- Después, el usuario es dirigido a la pantalla Home, donde se centraliza la navegación y acceso a las funciones principales.


2. **Gestión de entrenamientos (Workouts):**
- El usuario puede **añadir un nuevo workout**, ingresando detalles como nombre, duración, calorías o tipo de ejercicio.
- Los datos se guardan automáticamente en la **base de datos de Firebase**.
- Los workouts registrados pueden:
- **Consultarse** en la lista general.
- **Filtrarse** por categorías o criterios definidos.
- **Eliminarse** de forma individual.


3. **Datos y almacenamiento:**
- **Locales:** se usa IndexedDB/localStorage para conservar la información en el dispositivo.
- **Remotos:** la app sincroniza con Firebase para guardar la información en la nube.
- **Offline:** con Service Worker se permite registrar, consultar y gestionar entrenamientos sin conexión. Al recuperar internet, los datos se sincronizan automáticamente.


4. **Renderizado de vistas:**
- **Cliente (React):** gestiona las pantallas y componentes dinámicos (formulario de workouts, lista, filtros).
- **Servidor (Express):** expone y entrega recursos necesarios para la app.


5. **Uso de elementos físicos del dispositivo:**
- Se emplea la **geolocalización** para asociar la ubicación a ciertos entrenamientos.


6. **Instalación como PWA:**
- La aplicación puede instalarse en móviles y escritorio.
- Al instalarse, se comporta como una app nativa, con ícono propio, splash screen y ejecución independiente del navegador.


---


## ⚠️ Limitaciones
- **Notificaciones:** no fueron implementadas debido a restricciones técnicas de macOS Catalina. El resto de los requerimientos está cubierto.


---