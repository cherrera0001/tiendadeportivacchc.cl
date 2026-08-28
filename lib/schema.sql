CREATE TABLE IF NOT EXISTS categorias (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  nombre text NOT NULL,
  icono text NOT NULL DEFAULT '',
  orden int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS productos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  categoria_id bigint NOT NULL REFERENCES categorias(id),
  nombre text NOT NULL,
  slug text UNIQUE NOT NULL,
  marca text NOT NULL,
  descripcion text NOT NULL DEFAULT '',
  precio int NOT NULL CHECK (precio >= 0),
  precio_antes int CHECK (precio_antes IS NULL OR precio_antes > precio),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  evaluacion numeric(2,1) NOT NULL DEFAULT 0,
  resenas int NOT NULL DEFAULT 0,
  insignia text CHECK (insignia IS NULL OR insignia IN ('oferta', 'nuevo')),
  destacado int NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS producto_imagenes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id bigint NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url text NOT NULL DEFAULT '',
  alt text NOT NULL DEFAULT '',
  orden int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS suscriptores (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  correo text UNIQUE NOT NULL,
  nombre text,
  origen text NOT NULL DEFAULT 'newsletter',
  consentimiento_at timestamptz NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  token_baja text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

CREATE TABLE IF NOT EXISTS pedidos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text UNIQUE NOT NULL,
  estado text NOT NULL CHECK (estado IN ('pendiente','pagado','rechazado','cancelado')),
  correo text NOT NULL,
  nombre text,
  telefono text,
  direccion text,
  subtotal int NOT NULL,
  costo_despacho int NOT NULL,
  total int NOT NULL,
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  pagado_at timestamptz
);

CREATE TABLE IF NOT EXISTS pedido_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id bigint NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id bigint NOT NULL REFERENCES productos(id),
  nombre text NOT NULL,
  precio_unitario int NOT NULL,
  cantidad int NOT NULL CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS visitas_contador (
  clave text PRIMARY KEY,
  total bigint NOT NULL DEFAULT 0,
  actualizado_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO visitas_contador (clave, total) VALUES ('home', 0)
ON CONFLICT (clave) DO NOTHING;

CREATE TABLE IF NOT EXISTS eventos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  ocurrido_at timestamptz NOT NULL DEFAULT now(),
  session_id text,
  producto_id bigint REFERENCES productos(id),
  pedido_id bigint REFERENCES pedidos(id),
  valor_clp int,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_eventos_nombre_tiempo ON eventos (nombre, ocurrido_at DESC);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria_id);
