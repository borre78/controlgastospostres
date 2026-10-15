# Administración de usuarios — Control de Gastos y Costos

Se agregó la pantalla **Administración de usuarios** para PostresMila.

## Qué incluye
- Enlace de navegación visible solo para miembros cuyo rol de membresía sea `admin`.
- Listado de miembros, búsqueda, rol, estado activo/inactivo.
- Alta de cuenta con Firebase Authentication y creación de perfil `usuarios/{uid}` y membresía `negocios/postresmila/miembros/{uid}`.
- Cambios de rol y estado mediante Cloud Functions con Firebase Admin SDK.
- Envío de correo para establecer/restablecer contraseña mediante Firebase Authentication.
- Protección en el servidor: solo un administrador activo de PostresMila puede ejecutar las funciones.

## Antes de usar
**No basta con copiar el frontend. Las Cloud Functions deben desplegarse** para que el módulo pueda crear o modificar usuarios.

### 1. Revisar el administrador actual
En Firestore debe existir:
- `usuarios/{UID_DEL_ADMIN}` con `uid`, `activo: true` y `rol: "admin"`.
- `negocios/postresmila/miembros/{UID_DEL_ADMIN}` con `uid`, `activo: true` y `rol: "admin"`.

El UID es el UID real de Firebase Authentication. No lo inventes ni uses el correo como ID.

### 2. Habilitar recuperación de contraseña
En Firebase Console → Authentication → Templates, revisa la plantilla de restablecimiento de contraseña. En Authentication → Settings → Authorized domains, incluye el dominio donde se aloja la app.

### 3. Instalar Firebase CLI y desplegar
Desde la carpeta raíz del proyecto:
```bash
npm install
npm install --prefix functions
npm run build
firebase login
firebase use postresmila-4bf18
firebase deploy --only functions
```
Si Firebase CLI no está instalado:
```bash
npm install -g firebase-tools
```

La primera publicación de Cloud Functions puede pedir habilitar APIs y asociar una cuenta de facturación al proyecto (plan Blaze). Revisa los costos de Google Cloud/Firebase antes de habilitar facturación.

### 4. Publicar la app web
Después de probarla localmente:
```bash
npm run build
firebase deploy --only hosting
```
Asegúrate de que el proyecto tenga Hosting configurado y que el dominio publicado sea el correcto.

## Importante sobre reglas de Firestore
Las funciones usan Admin SDK y validan el rol de administrador en el servidor. Las reglas de Firestore siguen siendo necesarias para proteger el resto de la información y para que `viewer` no pueda escribir datos ni `editor` administrar usuarios. El ZIP que se recibió no incluía `firestore.rules`, por lo que no se modificaron ni se puede certificar que las reglas actuales apliquen todos los permisos por rol.

## Estructura de datos
- Perfil: `usuarios/{uid}`
- Membresía: `negocios/postresmila/miembros/{uid}`

El rol de la membresía del negocio es el que autoriza la administración de usuarios.
