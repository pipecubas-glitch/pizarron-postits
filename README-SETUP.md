# Pizarrón de post-its — guía de instalación

Esta guía sirve para dejar la app funcionando desde cero: crear el backend gratuito (Supabase), cargar los nombres del equipo, y compilar la app en la Mac.

## 1. Crear el proyecto gratuito en Supabase

1. Entrar a [supabase.com](https://supabase.com) y crear una cuenta gratuita.
2. Crear un **New project** (elegir cualquier nombre, ej. "pizarron-oficina", y una contraseña de base de datos — guardarla, no hace falta recordarla después).
3. Esperar 1-2 minutos a que el proyecto termine de crearse.

## 2. Crear la tabla de notas

Ir a **SQL Editor** (menú izquierdo) → **New query**, pegar esto y ejecutar (▶ Run):

```sql
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  text text default '',
  color text default '#fff59d',
  x float default 20,
  y float default 20,
  created_by text,
  claimed_by text,
  claimed_at timestamptz,
  due_date date,
  created_at timestamptz default now()
);

alter table public.notes enable row level security;

create policy "allow all select" on public.notes for select using (true);
create policy "allow all insert" on public.notes for insert with check (true);
create policy "allow all update" on public.notes for update using (true);
create policy "allow all delete" on public.notes for delete using (true);

alter publication supabase_realtime add table public.notes;
```

> Nota de seguridad: estas políticas dejan la tabla abierta a cualquiera que tenga la "anon key" del proyecto (paso 3). Es aceptable para un uso interno de 6 personas de confianza, pero la anon key no debería publicarse fuera del equipo (por ejemplo, no subir `config.js` ya completado a un repositorio público).

## 3. Obtener la URL y la clave (anon key)

1. Ir a **Project Settings** (ícono de engranaje) → **API**.
2. Copiar **Project URL** y **anon public key**.

## 4. Completar la configuración de la app

Abrir `src/shared/config.js` y completar:

```js
module.exports = {
  supabaseUrl: 'https://xxxxx.supabase.co',      // pegar el Project URL
  supabaseAnonKey: 'eyJhbGciOi...',              // pegar el anon public key
  teamNames: [
    'Nombre 1', 'Nombre 2', 'Nombre 3',
    'Nombre 4', 'Nombre 5', 'Nombre 6',
  ],
  noteColors: ['#fff59d', '#a5d6a7', '#90caf9', '#f48fb1', '#ffcc80', '#ce93d8'],
};
```

Reemplazar `teamNames` con los nombres reales de las 6 personas.

## 5. Compilar y correr en la Mac

En la Mac:

1. Instalar Node.js (versión LTS) desde [nodejs.org](https://nodejs.org) si no está instalado.
2. Copiar la carpeta `pizarron-postits` completa a la Mac (AirDrop, USB, o similar).
3. Abrir la app **Terminal**, ir a la carpeta del proyecto:
   ```
   cd ruta/a/pizarron-postits
   ```
4. Instalar dependencias:
   ```
   npm install
   ```
5. Probarla en modo desarrollo:
   ```
   npm start
   ```
   Debería aparecer la burbuja flotante en la pantalla. Al hacer click se abre el pizarrón.
6. Generar el instalador (`.dmg`) para repartir a las otras 5 personas:
   ```
   npm run dist
   ```
   El archivo queda en la carpeta `release/`.

### Nota sobre Gatekeeper

Como la app no está firmada con una cuenta de Apple Developer (de pago), la primera vez que alguien la abra macOS va a decir que no puede verificar al desarrollador. Hay que hacer **click derecho sobre la app → Abrir**, y confirmar "Abrir" en el cuadro de diálogo. Esto solo hace falta la primera vez.

## 6. Uso diario

- La burbuja se puede arrastrar a cualquier parte de la pantalla y queda siempre visible por encima de otras apps.
- Un click sobre la burbuja abre/cierra el pizarrón.
- Al abrir la app por primera vez, cada persona elige su nombre de la lista (se guarda localmente, no hay que volver a elegirlo).
- En la pestaña **Pizarrón** se crean, arrastran, colorean, "toman" y borran notas.
- En la pestaña **Calendario** se cargan tareas a futuro con fecha; aparecen también como notas en el pizarrón.
- Para dejar la app abierta siempre: agregarla a **Preferencias del Sistema → Elementos de inicio de sesión** en cada Mac.
