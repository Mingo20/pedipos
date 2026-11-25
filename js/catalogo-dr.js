/* PediPOS: catalogo base dominicano.
   72 productos de los que mas se venden en los colmados de Republica Dominicana, con foto
   descargada de Wikimedia Commons (ver img/productos/CREDITOS.md).
   Se siembra una sola vez por equipo: si el producto ya existe por nombre, no se toca; si le
   falta la foto, se le pone la del catalogo. */
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
 "img": "img/productos/lentejas.jpg"
},
{
 "nombre": "Garbanzos",
 "categoria": "Granos",
 "unidad": "libra",
 "precio": 70,
 "stock": 80,
 "img": "img/productos/garbanzos.jpg"
},
{
 "nombre": "Avena en Hojuelas",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 95,
 "stock": 50,
 "img": "img/productos/avena.jpg"
},
{
 "nombre": "Harina de Maiz",
 "categoria": "Despensa",
 "unidad": "libra",
 "precio": 40,
 "stock": 120,
 "img": "img/productos/harina-maiz.jpg"
},
{
 "nombre": "Mayonesa",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 110,
 "stock": 60,
 "img": "img/productos/mayonesa.jpg"
},
{
 "nombre": "Ketchup",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 95,
 "stock": 55,
 "img": "img/productos/ketchup.jpg"
},
{
 "nombre": "Cafe Instantaneo",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 150,
 "stock": 45,
 "img": "img/productos/cafe-instantaneo.jpg"
},
{
 "nombre": "Atun en Lata",
 "categoria": "Enlatados",
 "unidad": "unidad",
 "precio": 85,
 "stock": 80,
 "img": "img/productos/atun-lata.jpg"
},
{
 "nombre": "Sardinas en Lata",
 "categoria": "Enlatados",
 "unidad": "unidad",
 "precio": 55,
 "stock": 90,
 "img": "img/productos/sardinas.jpg"
},
{
 "nombre": "Maiz Dulce en Lata",
 "categoria": "Enlatados",
 "unidad": "unidad",
 "precio": 75,
 "stock": 60,
 "img": "img/productos/maiz-dulce-lata.jpg"
},
{
 "nombre": "Leche Condensada",
 "categoria": "Enlatados",
 "unidad": "unidad",
 "precio": 120,
 "stock": 70,
 "img": "img/productos/leche-condensada.jpg"
},
{
 "nombre": "Queso de Freir",
 "categoria": "Lacteos",
 "unidad": "libra",
 "precio": 280,
 "stock": 40,
 "img": "img/productos/queso-freir.jpg"
},
{
 "nombre": "Mortadela",
 "categoria": "Embutido",
 "unidad": "libra",
 "precio": 165,
 "stock": 50,
 "img": "img/productos/mortadela.jpg"
},
{
 "nombre": "Salchichas",
 "categoria": "Embutido",
 "unidad": "unidad",
 "precio": 140,
 "stock": 45,
 "img": "img/productos/salchichas.jpg"
},
{
 "nombre": "Carne de Res",
 "categoria": "Carnes",
 "unidad": "libra",
 "precio": 220,
 "stock": 35,
 "img": "img/productos/carne-res.jpg"
},
{
 "nombre": "Chuleta de Cerdo",
 "categoria": "Carnes",
 "unidad": "libra",
 "precio": 175,
 "stock": 40,
 "img": "img/productos/chuleta-cerdo.jpg"
},
{
 "nombre": "Papa",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 45,
 "stock": 110,
 "img": "img/productos/papa.jpg"
},
{
 "nombre": "Zanahoria",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 40,
 "stock": 80,
 "img": "img/productos/zanahoria.jpg"
},
{
 "nombre": "Repollo",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 30,
 "stock": 60,
 "img": "img/productos/repollo.jpg"
},
{
 "nombre": "Pepino",
 "categoria": "Viveres",
 "unidad": "unidad",
 "precio": 20,
 "stock": 70,
 "img": "img/productos/pepino.jpg"
},
{
 "nombre": "Berenjena",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 40,
 "stock": 50,
 "img": "img/productos/berenjena.jpg"
},
{
 "nombre": "Pan de Molde",
 "categoria": "Panaderia",
 "unidad": "unidad",
 "precio": 165,
 "stock": 30,
 "img": "img/productos/pan-molde.jpg"
},
{
 "nombre": "Galletas Dulces",
 "categoria": "Snacks",
 "unidad": "unidad",
 "precio": 25,
 "stock": 100,
 "img": "img/productos/galletas-dulces.jpg"
},
{
 "nombre": "Papas Fritas",
 "categoria": "Snacks",
 "unidad": "unidad",
 "precio": 45,
 "stock": 70,
 "img": "img/productos/papas-fritas.jpg"
},
{
 "nombre": "Mani Salado",
 "categoria": "Snacks",
 "unidad": "unidad",
 "precio": 40,
 "stock": 65,
 "img": "img/productos/mani-salado.jpg"
},
{
 "nombre": "Malta",
 "categoria": "Bebidas",
 "unidad": "unidad",
 "precio": 45,
 "stock": 120,
 "img": "img/productos/malta.jpg"
},
{
 "nombre": "Refresco en Lata",
 "categoria": "Bebidas",
 "unidad": "unidad",
 "precio": 60,
 "stock": 110,
 "img": "img/productos/refresco-lata.jpg"
},
{
 "nombre": "Limpiador Multiuso",
 "categoria": "Limpieza",
 "unidad": "unidad",
 "precio": 130,
 "stock": 55,
 "img": "img/productos/limpiador-multiuso.jpg"
},
{
 "nombre": "Suavizante de Ropa",
 "categoria": "Limpieza",
 "unidad": "unidad",
 "precio": 110,
 "stock": 50,
 "img": "img/productos/suavizante.jpg"
},
{
 "nombre": "Jabon de Bano",
 "categoria": "Higiene",
 "unidad": "unidad",
 "precio": 55,
 "stock": 75,
 "img": "img/productos/jabon-bano.jpg"
},
{
 "nombre": "Yautia",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 45,
 "stock": 70,
 "img": "img/productos/yautia.jpg"
},
{
 "nombre": "Name",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 50,
 "stock": 70,
 "img": "img/productos/name.jpg"
},
{
 "nombre": "Guineo",
 "categoria": "Viveres",
 "unidad": "unidad",
 "precio": 8,
 "stock": 200,
 "img": "img/productos/guineo.jpg"
},
{
 "nombre": "Lechuga",
 "categoria": "Viveres",
 "unidad": "unidad",
 "precio": 35,
 "stock": 60,
 "img": "img/productos/lechuga.jpg"
},
{
 "nombre": "Remolacha",
 "categoria": "Viveres",
 "unidad": "libra",
 "precio": 40,
 "stock": 55,
 "img": "img/productos/remolacha.jpg"
},
{
 "nombre": "Pimiento Verde",
 "categoria": "Viveres",
 "unidad": "unidad",
 "precio": 25,
 "stock": 80,
 "img": "img/productos/pimiento-verde.jpg"
},
{
 "nombre": "Apio",
 "categoria": "Viveres",
 "unidad": "unidad",
 "precio": 30,
 "stock": 60,
 "img": "img/productos/apio.jpg"
},
{
 "nombre": "Bacalao",
 "categoria": "Carnes",
 "unidad": "libra",
 "precio": 210,
 "stock": 35,
 "img": "img/productos/pescado.jpg"
},
{
 "nombre": "Longaniza",
 "categoria": "Embutido",
 "unidad": "libra",
 "precio": 175,
 "stock": 45,
 "img": "img/productos/longaniza.jpg"
},
{
 "nombre": "Yogurt",
 "categoria": "Lacteos",
 "unidad": "unidad",
 "precio": 90,
 "stock": 50,
 "img": "img/productos/yogurt.jpg"
},
{
 "nombre": "Crema de Leche",
 "categoria": "Lacteos",
 "unidad": "unidad",
 "precio": 120,
 "stock": 45,
 "img": "img/productos/crema-leche.jpg"
},
{
 "nombre": "Sopa en Sobre",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 25,
 "stock": 110,
 "img": "img/productos/sopa-sobre.jpg"
},
{
 "nombre": "Vinagre",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 45,
 "stock": 60,
 "img": "img/productos/vinagre.jpg"
},
{
 "nombre": "Salsa Picante",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 65,
 "stock": 55,
 "img": "img/productos/salsa-picante.jpg"
},
{
 "nombre": "Gelatina",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 30,
 "stock": 80,
 "img": "img/productos/gelatina.jpg"
},
{
 "nombre": "Cereal de Maiz",
 "categoria": "Despensa",
 "unidad": "unidad",
 "precio": 180,
 "stock": 40,
 "img": "img/productos/cereal-maiz.jpg"
},
{
 "nombre": "Jugo en Polvo",
 "categoria": "Bebidas",
 "unidad": "unidad",
 "precio": 25,
 "stock": 90,
 "img": "img/productos/jugo-polvo.jpg"
},
{
 "nombre": "Bebida Energizante",
 "categoria": "Bebidas",
 "unidad": "unidad",
 "precio": 95,
 "stock": 60,
 "img": "img/productos/bebida-energizante.jpg"
},
{
 "nombre": "Papel Toalla",
 "categoria": "Limpieza",
 "unidad": "unidad",
 "precio": 95,
 "stock": 55,
 "img": "img/productos/papel-toalla.jpg"
},
{
 "nombre": "Pasta Dental",
 "categoria": "Higiene",
 "unidad": "unidad",
 "precio": 120,
 "stock": 50,
 "img": "img/productos/pasta-dental.jpg"
},
 {
  "nombre": "Guandules Verdes",
  "categoria": "Granos",
  "unidad": "libra",
  "precio": 95,
  "stock": 80,
  "img": "img/productos/guandules.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Pigeon_peas_dried_(cropped).jpg",
  "licencia": "CC0",
  "autor": "David E Mead"
 },
 {
  "nombre": "Aguacate",
  "categoria": "Viveres",
  "unidad": "unidad",
  "precio": 65,
  "stock": 60,
  "img": "img/productos/aguacate.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Avocado_-_single_and_halved.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Splintercell10"
 },
 {
  "nombre": "Naranja Agria",
  "categoria": "Viveres",
  "unidad": "unidad",
  "precio": 15,
  "stock": 100,
  "img": "img/productos/naranja-agria.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Bitter_orange_-_Citrus_aurantium_01.JPG",
  "licencia": "CC BY-SA 4.0",
  "autor": "Zeynel Cebeci"
 },
 {
  "nombre": "Chinola",
  "categoria": "Viveres",
  "unidad": "unidad",
  "precio": 20,
  "stock": 80,
  "img": "img/productos/chinola.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Passiflora_edulis_fruit_on_white_background.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Filo gèn'"
 },
 {
  "nombre": "Aceite Manicero",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 850,
  "stock": 12,
  "img": "img/productos/aceite-manicero.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Peanut_oil_bottle.jpg",
  "licencia": "CC BY-SA 2.0",
  "autor": "Adam Engelhart"
 },
 {
  "nombre": "Lavaplatos Liquido",
  "categoria": "Limpieza",
  "unidad": "unidad",
  "precio": 165,
  "stock": 30,
  "img": "img/productos/lavaplatos.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Afwasmiddel.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "M.Minderhoud"
 },
 {
  "nombre": "Mostaza",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 145,
  "stock": 25,
  "img": "img/productos/mostaza.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:French%27s_classic_yellow_mustard_(cropped).jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "User:Aeæ~commonswiki"
 },
 {
  "nombre": "Pimienta Molida",
  "categoria": "Despensa",
  "unidad": "onza",
  "precio": 55,
  "stock": 40,
  "img": "img/productos/pimienta-molida.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Black_Peppercorns.jpg",
  "licencia": "CC BY-SA 4.0",
  "autor": "Xitop753"
 },
 {
  "nombre": "Queso Blanco",
  "categoria": "Lacteos",
  "unidad": "libra",
  "precio": 260,
  "stock": 30,
  "img": "img/productos/queso-blanco.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Queso_fresco.JPG",
  "licencia": "CC BY-SA 3.0",
  "autor": "Geoff"
 },
 {
  "nombre": "Pan Sobao",
  "categoria": "Panaderia",
  "unidad": "unidad",
  "precio": 25,
  "stock": 60,
  "img": "img/productos/pan-sobao.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Pan_sobao.jpg",
  "licencia": "CC BY 4.0",
  "autor": "LittleT889"
 },
 {
  "nombre": "Harina de Trigo",
  "categoria": "Despensa",
  "unidad": "libra",
  "precio": 45,
  "stock": 70,
  "img": "img/productos/harina-trigo.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:All-Purpose_Flour_(4107895947).jpg",
  "licencia": "CC BY-SA 2.0",
  "autor": "Veganbaking.net from USA"
 },
 {
  "nombre": "Servilletas",
  "categoria": "Limpieza",
  "unidad": "unidad",
  "precio": 85,
  "stock": 40,
  "img": "img/productos/servilletas.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Napkins_-_isolated.png",
  "licencia": "CC0",
  "autor": "Alanthebox"
 },
 {
  "nombre": "Bolsas de Basura",
  "categoria": "Limpieza",
  "unidad": "unidad",
  "precio": 95,
  "stock": 35,
  "img": "img/productos/bolsas-basura.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:A_typical_black_bin_bag_from_the_UK_20060811.jpg",
  "licencia": "Public domain",
  "autor": "Yuyudevil"
 },
 {
  "nombre": "Casabe",
  "categoria": "Panaderia",
  "unidad": "unidad",
  "precio": 90,
  "stock": 40,
  "img": "img/productos/casabe.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Casabe-2.jpg",
  "licencia": "CC BY-SA 3.0",
  "autor": "Luisovalles"
 },
 {
  "nombre": "Leche de Coco",
  "categoria": "Despensa",
  "unidad": "unidad",
  "precio": 120,
  "stock": 25,
  "img": "img/productos/leche-coco.jpg",
  "fuente": "https://commons.wikimedia.org/wiki/File:Coconut_milk_from_can01.JPG",
  "licencia": "CC BY-SA 3.0",
  "autor": "Meursault2004"
 }
];

  /* Foto de respaldo por categoria: ninguna categoria queda con el icono vacio,
     aunque ninguno de sus productos tenga foto todavia (Enlatados, por ejemplo). */
  const CAT_FOTO = {
    "Granos": "img/productos/arroz.jpg",
    "Despensa": "img/productos/azucar.jpg",
    "Lacteos": "img/productos/leche-evap.jpg",
    "Carnes": "img/productos/pollo.jpg",
    "Embutido": "img/productos/salami.jpg",
    "Viveres": "img/productos/platano.jpg",
    "Panaderia": "img/productos/pan.jpg",
    "Snacks": "img/productos/galletas.jpg",
    "Bebidas": "img/productos/jugo.jpg",
    "Limpieza": "img/productos/detergente.jpg",
    "Enlatados": "img/productos/atun-lata.jpg",
    "Higiene": "img/productos/papel-toalla.jpg"
  };
  function fotoCat(cat) { return CAT_FOTO[cat] || ""; }

  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  /* Identificador del catalogo GLOBAL: el mismo en todos los negocios.
     Los datos compartidos (nombre, categoria, unidad, foto) cuelgan de aqui;
     el precio, el costo y la existencia son de cada negocio. */
  const gidDe = (nombre) => norm(nombre).replace(/ /g, "-") || "producto";
  const GID = new Map(PRODUCTOS.map((p) => [gidDe(p.nombre), p]));
  const porGid = (gid) => GID.get(gid) || null;

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
        gid: gidDe(p.nombre),
        nombre: p.nombre, categoria: p.categoria, unidad: p.unidad,
        precio: p.precio, stock: p.stock, img: p.img,
        itbis: true, activo: true, dr: true,
      });
      n++;
    }
    return n;
  }

  /* Se ejecuta al abrir la app, despues de que la tienda cargue. */
  /* Equipos que ya sembraron antes: los productos sin foto reciben la suya.
     Devuelve la lista de los que se arreglaron, para devolverlos a la nube. */
  function reparar(db) {
    if (!db || !Array.isArray(db.products)) return [];
    const porNombre = new Map(PRODUCTOS.map((p) => [norm(p.nombre), p]));
    const tocados = [];
    for (const p of db.products) {
      const ref = porNombre.get(norm(p.nombre));
      let cambio = false;
      if (!p.gid && p.dr && ref) { p.gid = gidDe(ref.nombre); cambio = true; }
      if (!p.img) {
        const img = (ref && ref.img) || fotoCat(p.categoria);
        if (img) { p.img = img; cambio = true; }
      }
      if (cambio) tocados.push(p);
    }
    return tocados;
  }

  /* Mantiene al dia lo que es COMPARTIDO (nombre, categoria, unidad y foto) sin
     tocar lo que es de cada negocio: precio, costo, existencia y si esta activo. */
  function sincronizarCompartidos(db) {
    if (!db || !Array.isArray(db.products)) return [];
    const tocados = [];
    for (const p of db.products) {
      const ref = p.gid ? porGid(p.gid) : (p.dr ? porNombreDe(p.nombre) : null);
      if (!ref) continue;
      if (!p.gid) p.gid = gidDe(ref.nombre);
      let cambio = false;
      for (const campo of ["nombre", "categoria", "unidad", "img"]) {
        if (ref[campo] && p[campo] !== ref[campo]) { p[campo] = ref[campo]; cambio = true; }
      }
      if (cambio) tocados.push(p);
    }
    return tocados;
  }
  function porNombreDe(nombre) { return GID.get(gidDe(nombre)) || null; }
  function completarFotos(db) { return reparar(db).length; }

  /* Sube a la base central con la misma cola de siempre, sin bloquear nada. */
  function subir(lista) {
    try {
      for (const p of lista || []) window.PPSync && window.PPSync.saveProduct && window.PPSync.saveProduct(p);
    } catch (_) {}
  }

  function auto() {
    const S = window.PPStore;
    if (!S) return;
    const db = S.db;
    const nuevos = sembrar(db, S.uid);
    /* lo compartido se pone al dia y lo de cada negocio (precio, costo, stock) no se toca */
    const tocados = unir(reparar(db), sincronizarCompartidos(db));
    if (!nuevos && !tocados.length) return;
    S.save();
    subir(nuevos ? db.products.filter((p) => p.dr) : tocados);
    window.dispatchEvent(new CustomEvent("pp:catalogo", { detail: { nuevos, fotos: tocados.length } }));
  }

  /* Une dos listas de productos sin repetir. */
  function unir(a, b) {
    const vistos = new Set((a || []).map((p) => p.pid));
    return (a || []).concat((b || []).filter((p) => !vistos.has(p.pid)));
  }

  /* Al bajar de la nube pueden llegar productos sin foto (equipos que sembraron el
     catalogo antes de que existieran las imagenes, o ventas viejas). Se completan
     en el acto y se devuelven a la nube para que ningun equipo vuelva a verlos sin foto. */
  let _rep = 0;
  function repararTrasBajar() {
    const S = window.PPStore;
    if (!S || !S.db) return;
    const tocados = unir(reparar(S.db), sincronizarCompartidos(S.db));
    if (!tocados.length) return;
    S.save();
    subir(tocados);
    window.dispatchEvent(new CustomEvent("pp:catalogo", { detail: { fotos: tocados.length } }));
  }
  if (window.addEventListener) {
    window.addEventListener("pp:data", () => { clearTimeout(_rep); _rep = setTimeout(repararTrasBajar, 120); });
  }

  window.PPCatalogoDR = { PRODUCTOS, CAT_FOTO, GID, gidDe, porGid, sembrar, completarFotos, reparar, sincronizarCompartidos, repararTrasBajar, fotoCat, subir, auto, norm };
})();
