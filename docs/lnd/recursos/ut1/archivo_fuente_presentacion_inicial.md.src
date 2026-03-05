---
type: slide
---

# LND
## Lenguajes de marcas y sistemas de gestión de información

---

### UT1-R1 - Introducción a los lenguajes de marcas
![lenguaje_marcas_intro](https://hackmd.io/_uploads/H1ztBBXpA.jpg =50%x)

---

## 1. ¿Qué es un lenguaje de marcas?

* Sistema de **codificación** de datos en **documentos digitales**
* Utiliza **etiquetas** o marcas para definir su **formato** y **estructura**
* Principal función es **almacenar información** que pueda ser interpretada por **humanos** y por **sistemas informáticos**.

---

### Características principales:

---

### Propósito flexible
- Puede representar texto, imágenes, datos y más.
- Sirve tanto para la visualización en pantallas (HTML, markdown) como para la transmisión de datos (XML, JSON).

---

### Uso de etiquetas

* Los lenguajes de marcas utilizan etiquetas para definir la estructura y el contenido de los documentos.
* Las etiquetas suelen estar delimitadas por símbolos como `< >` o `{ }`, 
* Suelen agruparse en pares: una etiqueta de apertura (`<nombre>`) y una de cierre (`</nombre>`).

---

### Estructura jerárquica: 
* Los documentos se organizan en una **estructura de árbol**, donde las etiquetas se **anidan** unas dentro de otras para definir la **relación** entre los elementos.

```
<producto>
  <nombre>Ordenador Portátil</nombre>
  <precio>999.99</precio>
  <stock>25</stock>
  <categoria>
    <nombre>Electrónica</nombre>
    <subcategoria>
      <nombre>Informática</nombre>
    </subcategoria>
  </categoria>
  <descripcion>Portátil CPU i7 y 16GB de RAM</descripcion>
</producto>
```

---

#### Estructura en arbol del documento anterior

```
producto
├── nombre
│   └── Ordenador Portátil
├── precio
│   └── 999.99
├── stock
│   └── 25
├── categoria
│   ├── nombre
│   │   └── Electrónica
│   └── subcategoria
│       └── nombre
│           └── Informática
└── descripcion
    └── Portátil CPU i7 y 16GB de RAM
```

---

###  Etiquetas descriptivas

* Las etiquetas dan **formato**
* Describen el **significado** de los elementos.

```
<documento>
  <titulo formato="negrita" tamaño="20px" color="azul">Manual</titulo>
  <parrafo alineacion="justificado" interlineado="1.5">
    Bienvenido al manual de usuario. 
  </parrafo>
  <lista tipo="numerada" color="negro">
    <item>Encender el dispositivo</item>
    <item>Configurar la red</item>
    <item>Instalar aplicaciones</item>
  </lista>
</documento>

```

---

### Separación de contenido y presentación

* En muchos lenguajes de marcas (como HTML o XML), el **contenido está separado de la presentación**.
* Esto significa que:
    * Los datos y su estructura están definidos por el lenguaje de marcas
    * El formato/apariencia (colores, tipografía, estilos) puede manejarse por otro lenguaje o herramienta (como CSS en el caso de HTML).


---

### Interoperabilidad y Estándar

* Los lenguajes de marcas están diseñados para ser **interoperables**. 
* La información estructurada en un lenguaje de marcas puede ser entendida y procesada por diferentes sistemas y plataformas.
* Muchos de ellos son estándares abiertos, como XML o JSON, lo que facilita su adopción y uso en distintas aplicaciones.

---

### Legibilidad para Humanos y Máquinas

* Aunque están pensados para que las máquinas los interpreten
* Son legibles por humanos. Esto hace que sea relativamente fácil para las personas leer, escribir y modificar documentos.
* Se almacenan como texto, no se requiere software especializado para visualizarlos, y pueden ser abiertos con cualquier editor de texto.

---

### Extensibilidad

* Los lenguajes de marcas suelen ser extensibles
* Se pueden agregar nuevas etiquetas o atributos según las necesidades del proyecto o aplicación.
* Útil en lenguajes como XML, donde se pueden definir estructuras personalizadas para adaptarse a diferentes tipos de datos.

---

### Facilitan el Intercambio de Datos

* Los lenguajes de marcas permiten estructurar y compartir datos de manera estándar
* Se facilita el intercambio de información entre diferentes sistemas 
* Ejemplo: servicios web o API).

---

### Validación y Consistencia

* Muchos lenguajes de marcas permiten la validación del documento 
* Se usan esquemas o definiciones formales (como DTD o XSD en XML)
* Garantizan que los datos cumplan con una estructura específica.
* Asegura que los documentos sean consistentes y se ajusten a un formato predefinido.

---

## Clasificaciones de los lenguajes de marcas

* Los lenguajes de marcas se pueden clasificar de varias maneras
* Dependiendo de diferentes criterios

---

### 1. **Por Propósito**
* Lenguajes de marcas de propósito general
* Lenguajes de marcas de propósito específico
* 
---

### 2. **Por su estructura**

* Lenguajes de marcas basados en etiquetas
* Lenguajes de marcas basados en delimitadores
* Lenguajes de marcas basados en campos


---

### 3. **Por Ámbito de Aplicación**

* Web
* Intercambio de Datos
* Configuración

---

### 4. **Por Tipo de Información que Manejan**

* Documentales
* Datos Estructurados
* Configuración y Metadatos

---

### 5. Por Complejidad

- Lenguajes Simples
- Lenguajes Avanzados

---

## Ejemplos de lenguajes de marcas relevantes

---

### HTML (HyperText Markup Language)

- Usado para estructurar páginas web.
- Define el contenido que se verá en el navegador.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ejemplo de HTML</title>
  <link rel="stylesheet" href="estilos.css">
</head>
<body>
  <header>
    <h1>Bienvenido a mi sitio web</h1>
  </header>
</body>
</html>
```

---

### **XML (eXtensible Markup Language)**:
- Usado principalmente para el intercambio de datos.
- Es flexible y extensible, permitiendo crear nuevas etiquetas según la necesidad.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<biblioteca>
  <libro>
    <titulo>Cien años de soledad</titulo>
    <autor>Gabriel García Márquez</autor>
    <publicacion>
      <año>1967</año>
      <editorial>Sudamericana</editorial>
    </publicacion>
    <genero>Novela</genero>
  </libro>
</biblioteca>
```

---

### **JSON (JavaScript Object Notation)**:

- Un formato ligero para el intercambio de datos, principalmente utilizado en aplicaciones web.
- Se basa en la sintaxis de objetos de JavaScript.


```json
{
  "usuario": {
    "nombre": "Juan Pérez",
    "email": "juan.perez@example.com",
    "edad": 30,
    "activo": true,
    "preferencias": {
      "idioma": "español",
      "notificaciones": true,
      "tema": "oscuro"
    }
  }
}
```

---

### **YAML (YAML Ain't Markup Language)**:
- Un formato de serialización de datos legible por humanos.
- A menudo utilizado en archivos de configuración.
- Ejemplo:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp3s0:
      dhcp4: no
      dhcp6: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

---

### **Markdown**:
- Usado para crear texto enriquecido de forma sencilla.
- Principalmente utilizado en documentación y foros.

```markdown
# Recetas de cocina

## Pasta con salsa de tomate

![Imagen encabezado](https://example.com/tomate.jpg)

Ingredientes:
- 500 g de pasta
- [1 lata de tomates triturados](https://example.com/tomates-triturados)
- 2 dientes de ajo
- 1 cebolla
- Aceite de oliva
- Sal y pimienta al gusto
```

---
