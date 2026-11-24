/* PediPOS: catalogo base dominicano.
   42 productos de los que mas se venden en los colmados de Republica Dominicana, con foto
   descargada de Wikimedia Commons (ver img/productos/CREDITOS.md).
   Se siembra una sola vez por equipo: si el producto ya existe por nombre, no se toca. */
(function () {
  "use strict";
  const PRODUCTOS = [
 {
  "nombre": "Arroz Selecto",
  "categoria": "Granos",
  "unidad": "libra",
  "precio": 48,
  "stock": 300,
  "img": "img/productos/arroz.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Ceramic_bowl_full_of_white_rice.jpg",
  "licencia": "CC BY 2.0",
  "autor": "epSos.de"
 },
 {
  "nombre": "Habichuelas Rojas",
  "categoria": "Granos",
  "unidad": "libra",
  "precio": 75,
  "stock": 120,
  "img": "img/productos/habichuelas.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Red_Rajma_BNC.jpg",
  "licencia": "GFDL 1.2",
  "autor": "Prathyush Thomas"
 },
 {
  "nombre": "Azucar Criolla",
  "categoria": "Despensa",
  "unidad": "libra",
  "precio": 45,
  "stock": 200,
  "img": "img/productos/azucar.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Raw_sugar_closeup.jpg",
  "licencia": "CC BY-SA 2.5",
  "autor": "Editor at Large"
 },
 {
  "nombre": "Sal de Mesa",
  "categoria": "Despensa",
  "unidad": "libra",
  "precio": 18,
  "stock": 150,
  "img": "img/productos/sal.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Comparison_of_Table_Salt_with_Kitchen_Salt.png",
  "licencia": "CC BY-SA 4.0",
  "autor": "Lexlex"
 },
 {
  "nombre": "Cafe Molido",
  "categoria": "Despensa",
  "unidad": "libra",
  "precio": 260,
  "stock": 70,
  "img": "img/productos/cafe.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Espresso-roasted_coffee_beans_%28cropped%29.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": ""
 },
 {
  "nombre": "Aceite Vegetal 32 oz",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 265,
  "stock": 60,
  "img": "img/productos/aceite.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:2022-05-30_21_06_43_A_bottle_of_Wesson_vegetable_oil_in_the_Mountainville_section_of_Ewing_Township%2C_Mercer_County%2C_New_Jersey.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Famartin"
 },
 {
  "nombre": "Espaguetis",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 65,
  "stock": 90,
  "img": "img/productos/espagueti.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Spaghettoni.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "Nnaluci"
 },
 {
  "nombre": "Pasta de Tomate",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 40,
  "stock": 100,
  "img": "img/productos/pasta-tomate.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Tomato_paste_on_spoon.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "SKopp"
 },
 {
  "nombre": "Salsa Inglesa",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 70,
  "stock": 40,
  "img": "img/productos/salsa-inglesa.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Worcester_Sauce_001.jpg",
  "licencia": "CC0",
  "autor": "Ocdp"
 },
 {
  "nombre": "Sazon en Polvo",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 30,
  "stock": 120,
  "img": "img/productos/sazon.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Seasoning_Powder.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Marwan Bello"
 },
 {
  "nombre": "Caldo de Pollo en Cubos",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 25,
  "stock": 150,
  "img": "img/productos/caldo.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Brühwürfel-1.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "Rainer Z ..."
 },
 {
  "nombre": "Fosforos",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 12,
  "stock": 100,
  "img": "img/productos/fosforos.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Friction_d'une_allumette.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Yann SEGALEN"
 },
 {
  "nombre": "Leche en Polvo 400 g",
  "categoria": "Lacteos",
  "unidad": "unidad",
  "precio": 320,
  "stock": 45,
  "img": "img/productos/leche-polvo.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Milk_powder_cropped.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "ProjectManhattan"
 },
 {
  "nombre": "Leche Evaporada",
  "categoria": "Lacteos",
  "unidad": "unidad",
  "precio": 95,
  "stock": 60,
  "img": "img/productos/leche-evap.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Dosenmilch.jpg",
  "licencia": "Public domain",
  "autor": "HV"
 },
 {
  "nombre": "Huevos",
  "categoria": "Lacteos",
  "unidad": "unidad",
  "precio": 14,
  "stock": 300,
  "img": "img/productos/huevos.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Carton_of_eggs.jpg",
  "licencia": "CC BY 3.0",
  "autor": "Gisela Francisco"
 },
 {
  "nombre": "Mantequilla",
  "categoria": "Lacteos",
  "unidad": "unidad",
  "precio": 160,
  "stock": 40,
  "img": "img/productos/mantequilla.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Stick-of-butter-salted.jpg",
  "licencia": "CC0",
  "autor": "Photo courtesy photos-public-domain.com"
 },
 {
  "nombre": "Pollo Fresco",
  "categoria": "Carnes",
  "unidad": "libra",
  "precio": 120,
  "stock": 80,
  "img": "img/productos/pollo.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Raw_chicken_slices.jpg",
  "licencia": "CC0",
  "autor": "kakyusei"
 },
 {
  "nombre": "Salami Induveca",
  "categoria": "Embutido",
  "unidad": "libra",
  "precio": 190,
  "stock": 50,
  "img": "img/productos/salami.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Salame_di_Sauris.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Petar43"
 },
 {
  "nombre": "Queso Gouda",
  "categoria": "Embutido",
  "unidad": "libra",
  "precio": 290,
  "stock": 35,
  "img": "img/productos/queso.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Chesses_gouda_affinage.JPG",
  "licencia": "Public domain",
  "autor": "No machine-readable author provided. Alpha.prim~commonswiki assumed (based on copyright claims)."
 },
 {
  "nombre": "Jamonada de Pollo",
  "categoria": "Embutido",
  "unidad": "libra",
  "precio": 210,
  "stock": 30,
  "img": "img/productos/jamonada.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Ham_(4).jpg",
  "licencia": "Public domain",
  "autor": "Renee Comet (Photographer)"
 },
 {
  "nombre": "Platano Verde",
  "categoria": "Viveres",
  "unidad": "unidad",
  "precio": 25,
  "stock": 200,
  "img": "img/productos/platano.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Green_Plantains_%28Unsplash%29.jpg",
  "licencia": "CC0",
  "autor": "Henry Doe henrydoe"
 },
 {
  "nombre": "Yuca",
  "categoria": "Viveres",
  "unidad": "libra",
  "precio": 40,
  "stock": 90,
  "img": "img/productos/yuca.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Freshly_harvested_cassava_roots_in_a_yellow_basin.png",
  "licencia": "CC BY-SA 4.0",
  "autor": "Lebu Ayiga"
 },
 {
  "nombre": "Batata",
  "categoria": "Viveres",
  "unidad": "libra",
  "precio": 45,
  "stock": 70,
  "img": "img/productos/batata.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Ipomoea_batatas_006.JPG",
  "licencia": "CC BY-SA 3.0",
  "autor": "Llez"
 },
 {
  "nombre": "Auyama",
  "categoria": "Viveres",
  "unidad": "libra",
  "precio": 35,
  "stock": 60,
  "img": "img/productos/auyama.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Kalabasa_(Calabaza)_squash_from_the_Philippines.jpg",
  "licencia": "CC0",
  "autor": "Obsidian Soul"
 },
 {
  "nombre": "Cebolla Roja",
  "categoria": "Viveres",
  "unidad": "libra",
  "precio": 50,
  "stock": 80,
  "img": "img/productos/cebolla.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Red_onions_11.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Svklimkin"
 },
 {
  "nombre": "Ajo",
  "categoria": "Viveres",
  "unidad": "libra",
  "precio": 130,
  "stock": 40,
  "img": "img/productos/ajo.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Knoblauch_frisch.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "Bierfaß"
 },
 {
  "nombre": "Tomate",
  "categoria": "Viveres",
  "unidad": "libra",
  "precio": 55,
  "stock": 80,
  "img": "img/productos/tomate.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Tomato_je.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "Softeis"
 },
 {
  "nombre": "Aji Cubanela",
  "categoria": "Viveres",
  "unidad": "unidad",
  "precio": 20,
  "stock": 70,
  "img": "img/productos/aji.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Madame_Jeanette_and_other_chillies.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Takeaway"
 },
 {
  "nombre": "Limon",
  "categoria": "Viveres",
  "unidad": "unidad",
  "precio": 15,
  "stock": 120,
  "img": "img/productos/limon.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:DFC_6157_Fresh_green_limes_piled_high_ready_for_squeezing_or_seasoning.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "PattayaPatrol"
 },
 {
  "nombre": "Cilantro Ancho",
  "categoria": "Viveres",
  "unidad": "unidad",
  "precio": 20,
  "stock": 60,
  "img": "img/productos/cilantro.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Koriander_%28Coriandrum_sativum%29_Frische_B%C3%BCndel%2C_beim_T%C3%BCrken_in_MA--Josef_Schlaghecken.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Schlaghecken Josef"
 },
 {
  "nombre": "Pan de Agua",
  "categoria": "Panaderia",
  "unidad": "unidad",
  "precio": 20,
  "stock": 80,
  "img": "img/productos/pan.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Tin_Loaf_-_one_slash_in_the_crust.jpg",
  "licencia": "CC BY 2.0",
  "autor": "Mike Finn"
 },
 {
  "nombre": "Galletas de Soda",
  "categoria": "Snacks",
  "unidad": "unidad",
  "precio": 35,
  "stock": 100,
  "img": "img/productos/galletas.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:HK_food_%E6%A2%B3%E6%89%93%E9%A4%85%E4%B9%BE_Soda_biscuits_crackers_June_2024_R12S_01.jpg",
  "licencia": "CC0",
  "autor": "SZolramui Hwa Griom"
 },
 {
  "nombre": "Chocolate en Barra",
  "categoria": "Snacks",
  "unidad": "unidad",
  "precio": 70,
  "stock": 60,
  "img": "img/productos/chocolate.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Green_and_Black's_dark_chocolate_bar_2.jpg",
  "licencia": "CC0",
  "autor": "Mx. Granger"
 },
 {
  "nombre": "Refresco 2 L",
  "categoria": "Bebidas",
  "unidad": "unidad",
  "precio": 130,
  "stock": 60,
  "img": "img/productos/refresco.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Afri-ColaBottle.jpg",
  "licencia": "Public domain",
  "autor": "Sean Hegarty"
 },
 {
  "nombre": "Agua Botella 20 oz",
  "categoria": "Bebidas",
  "unidad": "unidad",
  "precio": 35,
  "stock": 120,
  "img": "img/productos/agua.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Water_Bottle_(51308317077).jpg",
  "licencia": "CC0",
  "autor": "Alabama Extension"
 },
 {
  "nombre": "Jugo de Naranja 1 L",
  "categoria": "Bebidas",
  "unidad": "unidad",
  "precio": 120,
  "stock": 40,
  "img": "img/productos/jugo.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Orangejuice.jpg",
  "licencia": "CC0",
  "autor": "rawpixel.com"
 },
 {
  "nombre": "Cerveza Presidente",
  "categoria": "Bebidas",
  "unidad": "unidad",
  "precio": 170,
  "stock": 90,
  "img": "img/productos/cerveza.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Jeju_beer_09_(cropped).jpg",
  "licencia": "CC BY 2.0",
  "autor": "KOREA.NET - Official page of the Republic of Korea"
 },
 {
  "nombre": "Ron Brugal",
  "categoria": "Bebidas",
  "unidad": "unidad",
  "precio": 650,
  "stock": 20,
  "img": "img/productos/ron.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Bottle_of_Captain_Morgan_Rum_02.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Pinakpani"
 },
 {
  "nombre": "Jabon de Cuaba",
  "categoria": "Limpieza",
  "unidad": "unidad",
  "precio": 40,
  "stock": 100,
  "img": "img/productos/jabon-cuaba.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Handmade_soap_cropped_and_simplified.jpg",
  "licencia": "CC BY 2.5",
  "autor": "Malene Thyssen, simplified by HLHJ"
 },
 {
  "nombre": "Cloro 1 L",
  "categoria": "Limpieza",
  "unidad": "unidad",
  "precio": 65,
  "stock": 70,
  "img": "img/productos/cloro.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Clorox_Bleach_products.jpg",
  "licencia": "CC BY-SA 2.0",
  "autor": "Adina Firestone"
 },
 {
  "nombre": "Papel Higienico 4 rollos",
  "categoria": "Limpieza",
  "unidad": "unidad",
  "precio": 160,
  "stock": 50,
  "img": "img/productos/papel.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Toiletpapier_(Gobran111).jpg",
  "licencia": "CC BY 2.5",
  "autor": "Brandon Blinkenberg"
 },
 {
  "nombre": "Detergente en Polvo",
  "categoria": "Limpieza",
  "unidad": "unidad",
  "precio": 100,
  "stock": 60,
  "img": "img/productos/detergente.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Pralni_prašek.JPG",
  "licencia": "Public domain",
  "autor": "Uncy at Slovenian Wikipedia"
 },
{
 "nombre": "Lentejas",
 "categoria": "Granos",
 "unidad": "libra",
 "precio": 60,
 "stock": 90,
 "img": ""
},
{
 "nombre": "Garbanzos",
 "categoria": "Granos",
 "unidad": "libra",
 "precio": 70,
 "stock": 80,
 "img": ""
},
{
 "nombre": "Avena en Hojuelas",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 95,
 "stock": 50,
 "img": ""
},
{
 "nombre": "Harina de Maiz",
 "categoria": "Despensa",
 "unidad": "libra",
 "precio": 40,
 "stock": 120,
 "img": ""
},
{
 "nombre": "Mayonesa",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 110,
 "stock": 60,
 "img": ""
},
{
 "nombre": "Ketchup",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 95,
 "stock": 55,
 "img": ""
},
{
 "nombre": "Cafe Instantaneo",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 150,
 "stock": 45,
 "img": ""
},
{
 "nombre": "Atun en Lata",
 "categoria": "Enlatados",
 "unidad": "unidad",
 "precio": 85,
 "stock": 80,
 "img": ""
},
{
 "nombre": "Sardinas en Lata",
 "categoria": "Enlatados",
 "unidad": "unidad",
 "precio": 55,
 "stock": 90,
 "img": ""
},
{
 "nombre": "Maiz Dulce en Lata",
 "categoria": "Enlatados",
 "unidad": "unidad",
 "precio": 75,
 "stock": 60,
 "img": ""
},
{
 "nombre": "Leche Condensada",
 "categoria": "Enlatados",
 "unidad": "unidad",
 "precio": 120,
 "stock": 70,
 "img": ""
},
{
 "nombre": "Queso de Freir",
 "categoria": "Lacteos",
 "unidad": "libra",
 "precio": 280,
 "stock": 40,
 "img": ""
},
{
 "nombre": "Mortadela",
 "categoria": "Embutido",
 "unidad": "libra",
 "precio": 165,
 "stock": 50,
 "img": ""
},
{
 "nombre": "Salchichas",
 "categoria": "Embutido",
 "unidad": "unidad",
 "precio": 140,
 "stock": 45,
 "img": ""
},
{
 "nombre": "Carne de Res",
 "categoria": "Carnes",
 "unidad": "libra",
 "precio": 220,
 "stock": 35,
 "img": ""
},
{
 "nombre": "Chuleta de Cerdo",
 "categoria": "Carnes",
 "unidad": "libra",
 "precio": 175,
 "stock": 40,
 "img": ""
},
{
 "nombre": "Papa",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 45,
 "stock": 110,
 "img": ""
},
{
 "nombre": "Zanahoria",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 40,
 "stock": 80,
 "img": ""
},
{
 "nombre": "Repollo",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 30,
 "stock": 60,
 "img": ""
},
{
 "nombre": "Pepino",
 "categoria": "Viveres",
 "unidad": "unidad",
 "precio": 20,
 "stock": 70,
 "img": ""
},
{
 "nombre": "Berenjena",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 40,
 "stock": 50,
 "img": ""
},
{
 "nombre": "Pan de Molde",
 "categoria": "Panaderia",
 "unidad": "unidad",
 "precio": 165,
 "stock": 30,
 "img": ""
},
{
 "nombre": "Galletas Dulces",
 "categoria": "Snacks",
 "unidad": "unidad",
 "precio": 25,
 "stock": 100,
 "img": ""
},
{
 "nombre": "Papas Fritas",
 "categoria": "Snacks",
 "unidad": "unidad",
 "precio": 45,
 "stock": 70,
 "img": ""
},
{
 "nombre": "Mani Salado",
 "categoria": "Snacks",
 "unidad": "unidad",
 "precio": 40,
 "stock": 65,
 "img": ""
},
{
 "nombre": "Malta",
 "categoria": "Bebidas",
 "unidad": "unidad",
 "precio": 45,
 "stock": 120,
 "img": ""
},
{
 "nombre": "Refresco en Lata",
 "categoria": "Bebidas",
 "unidad": "unidad",
 "precio": 60,
 "stock": 110,
 "img": ""
},
{
 "nombre": "Limpiador Multiuso",
 "categoria": "Limpieza",
 "unidad": "unidad",
 "precio": 130,
 "stock": 55,
 "img": ""
},
{
 "nombre": "Suavizante de Ropa",
 "categoria": "Limpieza",
 "unidad": "unidad",
 "precio": 110,
 "stock": 50,
 "img": ""
},
{
 "nombre": "Jabon de Bano",
 "categoria": "Higiene",
 "unidad": "unidad",
 "precio": 55,
 "stock": 75,
 "img": ""
}
];

  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  /* Agrega al catalogo los que falten. Devuelve cuantos entraron. */
  function sembrar(db, uid) {
    if (!db || !Array.isArray(db.products)) return 0;
    const hay = new Set(db.products.map((p) => norm(p.nombre)));
    let n = 0;
    for (const p of PRODUCTOS) {
      const clave = norm(p.nombre);
      if (hay.has(clave)) continue;
      hay.add(clave);
      db.products.push({
        pid: uid ? uid("P") : "P-" + Math.random().toString(36).slice(2, 9),
        nombre: p.nombre, categoria: p.categoria, unidad: p.unidad,
        precio: p.precio, stock: p.stock, img: p.img,
        itbis: true, activo: true, dr: true,
      });
      n++;
    }
    return n;
  }

  /* Se ejecuta al abrir la app, despues de que la tienda cargue. */
  function auto() {
    const S = window.PPStore;
    if (!S) return;
    const db = S.db;
    const nuevos = sembrar(db, S.uid);
    if (!nuevos) return;
    S.save();
    /* suben a la base central con la misma cola de siempre, sin bloquear nada */
    try {
      const lista = db.products.filter((p) => p.dr);
      for (const p of lista) window.PPSync && window.PPSync.saveProduct && window.PPSync.saveProduct(p);
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("pp:catalogo", { detail: { nuevos } }));
  }

  window.PPCatalogoDR = { PRODUCTOS, sembrar, auto, norm };
})();
