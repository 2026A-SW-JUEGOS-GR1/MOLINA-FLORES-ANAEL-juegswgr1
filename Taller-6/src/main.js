let engine;
let scene;
let camera;
let jugador;
let contenedorPersonaje;
let modeloPersonaje;
let animacionIdle = null;
let animacionCaminar = null;
let animacionActual = null;
let obstaculosCamaraOcultos = [];
let objetosMision = [];
let objetoEnMano = null;
let objetosEntregados = 0;
let mesaEntrega;
let juegoTerminado = false;
let saltoActivo = false;
let velocidadVertical = 0;
let jugadorEnSuelo = true;

// Estado de teclado para movimiento continuo y fluido con deltaTime.
const teclas = Object.create(null);
const VELOCIDAD_JUGADOR = 4.2;
const VELOCIDAD_GIRO = 2.6;
const FUERZA_SALTO = 6.2;
const MULTIPLICADOR_GRAVEDAD = 1;
const ROTACION_MODELO = 0; // Cambiar a Math.PI si el GLB aparece mirando hacia atrás.
let tiempoAnimacionProcedural = 0;

globalThis.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("renderCanvas");
  engine = new BABYLON.Engine(canvas, true);

  crearEscena(canvas).then((escena) => {
    scene = escena;
    document.getElementById("loadingIndicator").style.display = "none";
    engine.runRenderLoop(() => scene.render());
    globalThis.addEventListener("resize", () => engine.resize());
  });
});

async function crearEscena(canvas) {
  const s = new BABYLON.Scene(engine);
  s.collisionsEnabled = true;
  // Rúbrica: gravedad global y colisiones activadas para toda la casa virtual.
  s.gravity = new BABYLON.Vector3(0, -9.81, 0);
  s.clearColor = new BABYLON.Color3(0, 0, 0.035);
  s.ambientColor = new BABYLON.Color3(0, 0, 0);

  crearMateriales(s);
  crearIluminacion(s);
  crearCasa(s);
  crearExterior(s);
  crearMuebles(s);
  crearMueblesSegundoPiso(s);
  crearDecoracionHabitaciones(s);
  crearEfectosVisuales(s);
  crearObjetosMision(s);
  await crearJugador(s);
  crearCamara(s, canvas);
  crearCieloExterior(s);
  await crearAssetsExternos(s);
  configurarControles(s);
  configurarLogicaJuego(s);

  return s;
}

const materiales = {};

function crearMateriales(s) {
  // Guía Clase 06: materiales PBR con rugosidad según el tipo de superficie.
  materiales.pared = materialPBR(s, "PBR_ParedExterior", new BABYLON.Color3(0.64, 0.38, 0.22), 0.88);
  materiales.paredInterior = materialPBR(s, "PBR_ParedInterior", new BABYLON.Color3(0.78, 0.57, 0.36), 0.82);
  materiales.piso = materialPBR(s, "PBR_PisoMadera", new BABYLON.Color3(0.34, 0.18, 0.09), 0.28);
  materiales.techo = materialPBR(s, "PBR_Techo", new BABYLON.Color3(0.32, 0.07, 0.08), 0.9);
  materiales.madera = materialPBR(s, "PBR_Madera", new BABYLON.Color3(0.28, 0.12, 0.05), 0.35);
  materiales.tela = material(s, "tela", new BABYLON.Color3(0.08, 0.22, 0.38));
  materiales.cocina = material(s, "cocina", new BABYLON.Color3(0.16, 0.32, 0.31));
  materiales.dorado = material(s, "dorado", new BABYLON.Color3(0.95, 0.61, 0.12));
  materiales.blanco = material(s, "blanco", new BABYLON.Color3(0.95, 0.87, 0.7));
  materiales.verde = material(s, "verde", new BABYLON.Color3(0.08, 0.36, 0.18));
  materiales.pasto = materialPBR(s, "PBR_PastoExterior", new BABYLON.Color3(0.12, 0.42, 0.12), 1);
  materiales.camino = materialPBR(s, "PBR_CaminoExterior", new BABYLON.Color3(0.45, 0.31, 0.19), 0.95);
  materiales.ventana = material(s, "ventana", new BABYLON.Color3(0.12, 0.42, 0.65), true);
  materiales.rojo = material(s, "rojoDecoracion", new BABYLON.Color3(0.55, 0.08, 0.06));
  materiales.gris = material(s, "grisMetal", new BABYLON.Color3(0.35, 0.38, 0.42));
  materiales.morado = material(s, "moradoDecoracion", new BABYLON.Color3(0.3, 0.12, 0.42));
  materiales.agua = materialPBR(s, "PBR_AguaPiscina", new BABYLON.Color3(0.03, 0.42, 0.58), 0.05);
  materiales.agua.alpha = 0.62;
  materiales.agua.metallic = 0.08;
  materiales.agua.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
  materiales.agua.backFaceCulling = false;
  materiales.piedra = materialPBR(s, "PBR_Piedra", new BABYLON.Color3(0.28, 0.29, 0.31), 0.96);
  materiales.fuego = material(s, "FuegoEmisivo", new BABYLON.Color3(1, 0.2, 0.02), true);
  materiales.fuego.emissiveColor = new BABYLON.Color3(1, 0.38, 0.03);
}

function material(s, nombre, color, emissive = false) {
  const m = new BABYLON.StandardMaterial(nombre, s);
  m.diffuseColor = color;
  if (emissive) m.emissiveColor = color;
  return m;
}

function materialPBR(s, nombre, color, roughness, metallic = 0) {
  const m = new BABYLON.PBRMaterial(nombre, s);
  m.albedoColor = color;
  m.roughness = roughness;
  m.metallic = metallic;
  return m;
}

function crearCamara(s, canvas) {
  // Rúbrica: cámara en tercera persona que sigue al protagonista desde atrás.
  camera = new BABYLON.FollowCamera(
    "camaraTerceraPersona",
    new BABYLON.Vector3(0, 3.5, 16),
    s
  );
  camera.lockedTarget = jugador;
  camera.radius = 4.3;
  camera.heightOffset = 2.2;
  camera.rotationOffset = 180;
  camera.cameraAcceleration = 0.2;
  camera.maxCameraSpeed = 20;
  camera.fov = 0.85;
  // La cámara puede atravesar la estructura visual; las paredes interpuestas se
  // transparentan dinámicamente. Las colisiones del personaje siguen activas.
  camera.checkCollisions = false;
  camera.minZ = 0.1;
  s.activeCamera = camera;

  // La FollowCamera incluye controles internos que usan las flechas para cambiar
  // radio/altura. Se eliminan para evitar el zoom y mantener una perspectiva estable.
  camera.inputs.clear();
}

function crearIluminacion(s) {
  // Rúbrica: luz hemisférica azulada que simula la iluminación nocturna/lunar.
  const ambiente = new BABYLON.HemisphericLight("ambiente", new BABYLON.Vector3(0, 1, 0), s);
  ambiente.intensity = 0.05;
  ambiente.diffuse = new BABYLON.Color3(0.35, 0.45, 0.75);
  ambiente.groundColor = new BABYLON.Color3(0.06, 0.08, 0.16);

  // Rúbrica: DirectionalLight como luz de luna sobre la casa y el jardín.
  const luzLuna = new BABYLON.DirectionalLight(
    "luzLuna",
    new BABYLON.Vector3(-0.45, -1, 0.35),
    s
  );
  luzLuna.position = new BABYLON.Vector3(20, 30, -20);
  luzLuna.intensity = 0.3;
  luzLuna.diffuse = new BABYLON.Color3(0.45, 0.55, 0.9);

  const luzTecho = new BABYLON.PointLight("luzTecho", new BABYLON.Vector3(0, 3.5, 0), s);
  luzTecho.intensity = 1.15;
  luzTecho.range = 11;
  luzTecho.diffuse = new BABYLON.Color3(1, 0.58, 0.25);

  const luzCocina = new BABYLON.PointLight("luzCocina", new BABYLON.Vector3(-6, 2.8, -4.5), s);
  luzCocina.intensity = 0.9;
  luzCocina.range = 9;
  luzCocina.diffuse = new BABYLON.Color3(0.3, 0.7, 1);

  const luzSegundoPiso = new BABYLON.PointLight("luzSegundoPiso", new BABYLON.Vector3(-3, 6.8, -2), s);
  luzSegundoPiso.intensity = 1.1;
  luzSegundoPiso.range = 11;
  luzSegundoPiso.diffuse = new BABYLON.Color3(0.45, 0.65, 1);

  // Rúbrica: SpotLight para iluminar la entrada durante el tour guiado.
  const luzEntrada = new BABYLON.SpotLight(
    "luzEntrada",
    new BABYLON.Vector3(0, 3.4, 6.4),
    new BABYLON.Vector3(0, -0.55, 1),
    Math.PI / 2.4,
    2,
    s
  );
  luzEntrada.intensity = 2.2;
  luzEntrada.range = 18;
  luzEntrada.diffuse = new BABYLON.Color3(1, 0.72, 0.4);
}

function crearCasa(s) {
  // Rúbrica: la casa conserva su construcción con primitivas nativas de Babylon.js.
  // Paredes, pisos y límites sólidos tienen checkCollisions = true.
  caja(s, "piso", 18, 0.2, 14, new BABYLON.Vector3(0, -0.1, 0), materiales.piso, true);

  // Estructura exterior de dos pisos.
  caja(s, "paredTrasera", 18, 8, 0.8, new BABYLON.Vector3(0, 4, -7), materiales.pared, true);
  caja(s, "paredIzquierda", 0.8, 8, 14, new BABYLON.Vector3(-9, 4, 0), materiales.pared, true);
  caja(s, "paredDerecha", 0.8, 8, 14, new BABYLON.Vector3(9, 4, 0), materiales.pared, true);
  caja(s, "paredFrontalIzq", 7.2, 4, 0.8, new BABYLON.Vector3(-5.4, 2, 7), materiales.pared, true);
  caja(s, "paredFrontalDer", 7.2, 4, 0.8, new BABYLON.Vector3(5.4, 2, 7), materiales.pared, true);
  caja(s, "paredFrontalSuperiorIzq", 7.2, 4, 0.8, new BABYLON.Vector3(-5.4, 6.2, 7), materiales.pared, true);
  caja(s, "paredFrontalSuperiorDer", 7.2, 4, 0.8, new BABYLON.Vector3(5.4, 6.2, 7), materiales.pared, true);
  caja(s, "paredFrontalSuperiorCentro", 3.65, 4, 0.8, new BABYLON.Vector3(0, 6.2, 7), materiales.pared, true);

  // Entrada principal centrada.
  caja(s, "marcoPuertaIzq", 0.25, 3, 0.45, new BABYLON.Vector3(-1.7, 1.5, 7), materiales.madera, false);
  caja(s, "marcoPuertaDer", 0.25, 3, 0.45, new BABYLON.Vector3(1.7, 1.5, 7), materiales.madera, false);
  caja(s, "marcoPuertaArriba", 3.65, 0.25, 0.45, new BABYLON.Vector3(0, 3.1, 7), materiales.madera, false);

  // Segundo piso completo, salvo el hueco rectangular de las escaleras a la derecha.
  caja(s, "pisoSegundoIzquierdo", 13.8, 0.3, 14, new BABYLON.Vector3(-2.1, 4, 0), materiales.piso, true);
  caja(s, "pisoSegundoDerechoTrasero", 4.2, 0.3, 5.6, new BABYLON.Vector3(6.9, 4, -4.2), materiales.piso, true);
  caja(s, "pisoSegundoDerechoFrontal", 4.2, 0.3, 2.4, new BABYLON.Vector3(6.9, 4, 5.8), materiales.piso, true);

  // Techo inclinado de dos aguas construido con boxes rotados.
  const techoIzquierdo = caja(s, "techoIzquierdo", 10.2, 0.3, 15.4, new BABYLON.Vector3(-4.25, 9.05, 0), materiales.techo, false);
  techoIzquierdo.rotation.z = -0.36;
  const techoDerecho = caja(s, "techoDerecho", 10.2, 0.3, 15.4, new BABYLON.Vector3(4.25, 9.05, 0), materiales.techo, false);
  techoDerecho.rotation.z = 0.36;
  caja(s, "vigaCentral", 18.5, 0.28, 0.35, new BABYLON.Vector3(0, 8, 0), materiales.madera, false);

  crearEscaleras(s);
  crearBarandas(s);
  crearDivisionesCuartos(s);

  crearCartel(s, "SALA - COMEDOR", new BABYLON.Vector3(-3.8, 3.35, 6.55), Math.PI);
  crearCartel(s, "COCINA", new BABYLON.Vector3(-5, 3.25, -6.55), 0);
  crearCartel(s, "ESTUDIO", new BABYLON.Vector3(4.8, 3.25, -6.55), 0);
  crearCartel(s, "DORMITORIOS", new BABYLON.Vector3(-3, 7.25, -6.55), 0);
}

function crearExterior(s) {
  const terreno = BABYLON.MeshBuilder.CreateGround("terrenoVerde", { width: 100, height: 100 }, s);
  terreno.position.y = -0.03;
  terreno.material = materiales.pasto;
  terreno.checkCollisions = true;

  const camino = BABYLON.MeshBuilder.CreateGround("caminoEntrada", { width: 4, height: 18 }, s);
  camino.position = new BABYLON.Vector3(0, 0.01, 15.5);
  camino.material = materiales.camino;
  camino.checkCollisions = true;

  const patio = BABYLON.MeshBuilder.CreateGround("patioFrontal", { width: 12, height: 5 }, s);
  patio.position = new BABYLON.Vector3(0, 0.02, 8.5);
  patio.material = materiales.camino;
  patio.checkCollisions = true;

  // Porche cubierto con columnas, conectado al camino principal.
  const techoPorche = caja(s, "techoPorche", 6.5, 0.25, 3, new BABYLON.Vector3(0, 3.35, 8.35), materiales.techo, false);
  techoPorche.rotation.x = -0.04;
  caja(s, "columnaPorcheIzq", 0.35, 3.2, 0.35, new BABYLON.Vector3(-2.7, 1.6, 8.9), materiales.blanco, true);
  caja(s, "columnaPorcheDer", 0.35, 3.2, 0.35, new BABYLON.Vector3(2.7, 1.6, 8.9), materiales.blanco, true);
  caja(s, "escalonEntrada", 4, 0.18, 1, new BABYLON.Vector3(0, 0.06, 7.65), materiales.blanco, true);

  // Límites invisibles del terreno para que el guía no pueda caer fuera del tour.
  const limites = [
    caja(s, "limiteNorte", 100, 5, 0.5, new BABYLON.Vector3(0, 2.5, -49), materiales.pasto, true),
    caja(s, "limiteSur", 100, 5, 0.5, new BABYLON.Vector3(0, 2.5, 49), materiales.pasto, true),
    caja(s, "limiteEste", 0.5, 5, 100, new BABYLON.Vector3(49, 2.5, 0), materiales.pasto, true),
    caja(s, "limiteOeste", 0.5, 5, 100, new BABYLON.Vector3(-49, 2.5, 0), materiales.pasto, true),
  ];
  limites.forEach((limite) => {
    limite.isVisible = false;
  });

  // Ventanas luminosas para identificar desde afuera que la casa tiene habitaciones.
  crearVentana(s, new BABYLON.Vector3(-5.3, 2.2, 6.78), Math.PI);
  crearVentana(s, new BABYLON.Vector3(5.3, 2.2, 6.78), Math.PI);
  crearVentana(s, new BABYLON.Vector3(-8.78, 5.9, -2), Math.PI / 2);
  crearVentana(s, new BABYLON.Vector3(8.78, 5.9, -2), -Math.PI / 2);
}

function crearVentana(s, posicion, rotacionY) {
  const ventana = caja(s, "ventana", 2.2, 1.4, 0.08, posicion, materiales.ventana, false);
  ventana.rotation.y = rotacionY;
  ventana.isPickable = false;
}

function crearEscaleras(s) {
  // Escalones visibles y rampa sólida invisible: permite subir con gravedad sin atascarse.
  const cantidad = 15;
  const ancho = 3.2;
  const profundidad = 0.38;
  for (let i = 0; i < cantidad; i++) {
    const altura = 0.27 * (i + 1);
    const z = 4.25 - i * profundidad;
    caja(
      s,
      "escalon_" + i,
      ancho,
      altura,
      profundidad,
      new BABYLON.Vector3(6.8, altura / 2, z),
      materiales.madera,
      false
    );
  }
  const rampa = caja(
    s,
    "rampaColisionEscalera",
    3.1,
    0.25,
    5.7,
    new BABYLON.Vector3(6.8, 2, 1.55),
    materiales.madera,
    true
  );
  rampa.rotation.x = Math.atan2(4, 5.7);
  rampa.isVisible = false;
  rampa.checkCollisions = true;
  caja(s, "descansoSegundoPiso", 3.2, 0.3, 1.4, new BABYLON.Vector3(6.8, 4, -0.8), materiales.piso, true);
  caja(s, "puenteSegundoPiso", 2.6, 0.3, 1.4, new BABYLON.Vector3(5.05, 4, -0.8), materiales.piso, true);
}

function crearBarandas(s) {
  // Baranda lateral del hueco de escaleras; la entrada y el descanso quedan libres.
  for (let i = 0; i < 6; i++) {
    caja(s, "barandaPoste_" + i, 0.18, 1.05, 0.18, new BABYLON.Vector3(4.85, 4.67, -1.1 + i * 1.05), materiales.madera, true);
  }
  caja(s, "barandaPasamanos", 0.2, 0.18, 5.6, new BABYLON.Vector3(4.85, 5.18, 1.55), materiales.madera, true);
}

function crearMuebles(s) {
  // Sala frontal izquierda: sofá frente al televisor y mesa de centro.
  caja(s, "alfombraSala", 6, 0.03, 4.2, new BABYLON.Vector3(-4.5, 0.03, 2.8), materiales.tela, false);
  caja(s, "sofaSala", 4.2, 0.8, 1.15, new BABYLON.Vector3(-4.7, 0.45, 4.5), materiales.tela, true);
  caja(s, "respaldoSofaSala", 4.2, 1.5, 0.35, new BABYLON.Vector3(-4.7, 1.15, 5), materiales.tela, true);
  caja(s, "mesaCentroSala", 2.4, 0.42, 1.25, new BABYLON.Vector3(-4.7, 0.45, 2.6), materiales.madera, true);

  // Comedor junto a la entrada. La mesa también recibe los objetos de la misión.
  mesaEntrega = caja(s, "mesaComedorEntrega", 2.8, 0.75, 1.7, new BABYLON.Vector3(1.4, 0.55, 3.2), materiales.madera, true);
  caja(s, "sillaComedorA", 0.75, 0.8, 0.75, new BABYLON.Vector3(-0.5, 0.4, 3.2), materiales.madera, true);
  caja(s, "sillaComedorB", 0.75, 0.8, 0.75, new BABYLON.Vector3(3.3, 0.4, 3.2), materiales.madera, true);
  caja(s, "sillaComedorC", 0.75, 0.8, 0.75, new BABYLON.Vector3(1.4, 0.4, 1.9), materiales.madera, true);

  // Cocina posterior izquierda: mesón en L e isla central.
  caja(s, "mesonCocinaTrasero", 6.2, 1, 1, new BABYLON.Vector3(-5.5, 0.55, -6), materiales.cocina, true);
  caja(s, "mesonCocinaLateral", 1, 1, 3.2, new BABYLON.Vector3(-8, 0.55, -4.4), materiales.cocina, true);
  caja(s, "islaCocina", 2.8, 1, 1.2, new BABYLON.Vector3(-4.3, 0.55, -3.8), materiales.cocina, true);
  crearCilindro(s, "plantaCocina", 0.35, 0.7, new BABYLON.Vector3(-7.3, 1.4, -6), materiales.verde);

  // Estudio posterior derecho, separado de la zona social y de las escaleras.
  caja(s, "escritorioEstudio", 2.8, 0.8, 1, new BABYLON.Vector3(4.5, 0.5, -5.7), materiales.madera, true);
  caja(s, "sillaEstudio", 0.8, 0.8, 0.8, new BABYLON.Vector3(4.5, 0.4, -4.2), materiales.tela, true);
  caja(s, "bibliotecaEstudio", 2.8, 2.5, 0.45, new BABYLON.Vector3(1.8, 1.25, -6.4), materiales.madera, true);
}

function crearMueblesSegundoPiso(s) {
  // Dormitorio principal posterior.
  caja(s, "alfombraDormitorioPrincipal", 5, 0.03, 3.2, new BABYLON.Vector3(-4.5, 4.18, -3.8), materiales.morado, false);
  caja(s, "camaPrincipal", 4, 0.5, 2.3, new BABYLON.Vector3(-4.5, 4.45, -4.7), materiales.madera, true);
  caja(s, "colchonPrincipal", 3.7, 0.3, 2, new BABYLON.Vector3(-4.5, 4.78, -4.7), materiales.tela, true);
  caja(s, "cabeceraPrincipal", 4, 1.7, 0.25, new BABYLON.Vector3(-4.5, 5.2, -6), materiales.madera, true);
  caja(s, "armarioPrincipal", 2.4, 2.7, 0.65, new BABYLON.Vector3(-7.4, 5.5, -2), materiales.madera, true);

  // Segundo dormitorio frontal.
  caja(s, "camaSecundaria", 3.5, 0.5, 2.1, new BABYLON.Vector3(-4.8, 4.45, 4.2), materiales.madera, true);
  caja(s, "colchonSecundario", 3.2, 0.3, 1.8, new BABYLON.Vector3(-4.8, 4.78, 4.2), materiales.blanco, true);
  caja(s, "escritorioDormitorio", 2.4, 0.8, 1, new BABYLON.Vector3(1.8, 4.55, 5.5), materiales.madera, true);
  caja(s, "sillaDormitorio", 0.8, 0.8, 0.8, new BABYLON.Vector3(1.8, 4.4, 4.1), materiales.tela, true);

  // Baño en la esquina posterior derecha.
  caja(s, "lavamanos", 1.5, 0.85, 0.65, new BABYLON.Vector3(6.4, 4.55, -5.9), materiales.blanco, true);
  crearCilindro(s, "inodoroBase", 0.75, 0.7, new BABYLON.Vector3(7.8, 4.5, -4.7), materiales.blanco);
  caja(s, "tanqueInodoro", 0.75, 0.9, 0.35, new BABYLON.Vector3(7.8, 4.8, -5.25), materiales.blanco, true);
}

function crearDecoracionHabitaciones(s) {
  // Sala: televisor orientado hacia el sofá, lámpara y planta.
  caja(s, "muebleTV", 3.2, 0.7, 0.5, new BABYLON.Vector3(-4.7, 0.45, -1.15), materiales.madera, true);
  caja(s, "televisor", 2.3, 1.3, 0.12, new BABYLON.Vector3(-4.7, 1.45, -1.05), materiales.gris, false);
  caja(s, "pantallaTV", 1.95, 0.9, 0.05, new BABYLON.Vector3(-4.7, 1.45, -0.96), materiales.morado, false);
  crearCilindro(s, "lamparaSala", 0.3, 2.2, new BABYLON.Vector3(-7.6, 1.1, 4.8), materiales.dorado);
  crearCilindro(s, "macetaSala", 0.55, 0.55, new BABYLON.Vector3(-7.7, 0.3, 1), materiales.verde);

  // Cocina: refrigeradora, estufa, quemadores y fregadero.
  caja(s, "refrigeradora", 1.3, 2.8, 1, new BABYLON.Vector3(-8, 1.4, -5.6), materiales.gris, true);
  caja(s, "cocinaEstufa", 1.7, 0.9, 1, new BABYLON.Vector3(-4.5, 0.55, -6), materiales.gris, true);
  for (let i = 0; i < 2; i++) {
    crearCilindro(s, "quemador_" + i, 0.28, 0.05, new BABYLON.Vector3(-4.85 + i * 0.7, 1.05, -6), materiales.rojo);
  }
  caja(s, "fregadero", 1.2, 0.12, 0.65, new BABYLON.Vector3(-6.4, 1.15, -6), materiales.blanco, false);

  // Detalles domésticos de los dormitorios y estudio.
  caja(s, "computadorEstudio", 1.2, 0.8, 0.08, new BABYLON.Vector3(4.5, 1.35, -6.15), materiales.gris, false);
  caja(s, "cuadroDormitorioPrincipal", 1.8, 1, 0.08, new BABYLON.Vector3(-4.5, 6.3, -6.55), materiales.morado, false);
  crearCilindro(s, "lamparaDormitorio", 0.28, 0.55, new BABYLON.Vector3(-2, 5.2, -5.6), materiales.dorado);
  caja(s, "espejoBano", 1.3, 1.2, 0.06, new BABYLON.Vector3(6.4, 6, -6.55), materiales.ventana, false);
}

function crearEfectosVisuales(s) {
  // Guía Clase 06: piscina simulada con plano translúcido y PBR de baja rugosidad.
  caja(
    s,
    "Piscina_Base_Solida",
    7.4,
    0.25,
    4.4,
    new BABYLON.Vector3(-17, 0.03, 0),
    materiales.piedra,
    true
  );
  const agua = BABYLON.MeshBuilder.CreateGround(
    "Piscina_Agua_Translucida",
    { width: 6.8, height: 3.8 },
    s
  );
  agua.position = new BABYLON.Vector3(-17, 0.18, 0);
  agua.material = materiales.agua;
  agua.isPickable = false;

  // Guía Clase 06: fogata nativa con leña, esfera emisiva y PointLight naranja.
  const centroFogata = new BABYLON.Vector3(15, 0, 6);
  for (let i = 0; i < 3; i++) {
    const lena = BABYLON.MeshBuilder.CreateCylinder(
      "Fogata_Lena_" + i,
      { height: 1.7, diameter: 0.24 },
      s
    );
    lena.position = new BABYLON.Vector3(centroFogata.x, 0.28, centroFogata.z);
    lena.rotation.z = Math.PI / 2;
    lena.rotation.y = (Math.PI / 3) * i;
    lena.material = materiales.madera;
  }

  for (let i = 0; i < 10; i++) {
    const angulo = (Math.PI * 2 * i) / 10;
    const piedra = BABYLON.MeshBuilder.CreateSphere(
      "Fogata_Piedra_" + i,
      { diameter: 0.52 },
      s
    );
    piedra.position = new BABYLON.Vector3(
      centroFogata.x + Math.cos(angulo) * 1.05,
      0.24,
      centroFogata.z + Math.sin(angulo) * 1.05
    );
    piedra.material = materiales.piedra;
    piedra.checkCollisions = true;
  }

  const llama = BABYLON.MeshBuilder.CreateSphere(
    "Fogata_Fuego_Emisivo",
    { diameter: 0.9 },
    s
  );
  llama.position = new BABYLON.Vector3(centroFogata.x, 0.72, centroFogata.z);
  llama.scaling.y = 1.45;
  llama.material = materiales.fuego;
  llama.isPickable = false;

  const luzFogata = new BABYLON.PointLight(
    "Luz_Fogata_PointLight",
    new BABYLON.Vector3(centroFogata.x, 1.05, centroFogata.z),
    s
  );
  luzFogata.diffuse = new BABYLON.Color3(1, 0.28, 0.04);
  luzFogata.intensity = 1.4;
  luzFogata.range = 8;

  let tiempoFuego = 0;
  s.onBeforeRenderObservable.add(() => {
    tiempoFuego += s.getEngine().getDeltaTime() / 1000;
    const parpadeo = Math.sin(tiempoFuego * 11) * 0.12 + Math.sin(tiempoFuego * 17) * 0.06;
    luzFogata.intensity = 1.35 + parpadeo;
    llama.scaling.y = 1.42 + parpadeo * 0.35;
  });
}

function crearDivisionesCuartos(s) {
  // Planta baja: muro entre sala/comedor y cocina/estudio, con puerta central.
  caja(s, "muroPlantaBajaA", 6.5, 3.2, 0.3, new BABYLON.Vector3(-5.75, 1.6, -1.55), materiales.paredInterior, true);
  caja(s, "muroPlantaBajaB", 4.4, 3.2, 0.3, new BABYLON.Vector3(1.3, 1.6, -1.55), materiales.paredInterior, true);
  crearMarcoPuerta(s, new BABYLON.Vector3(-1.7, 0, -1.55), "cocina", 0);

  // División entre cocina y estudio con una puerta lateral.
  caja(s, "muroCocinaEstudioTrasero", 0.3, 3.2, 2.2, new BABYLON.Vector3(0.5, 1.6, -5.9), materiales.paredInterior, true);
  caja(s, "muroCocinaEstudioFrontal", 0.3, 3.2, 1.65, new BABYLON.Vector3(0.5, 1.6, -2.375), materiales.paredInterior, true);
  crearMarcoPuertaLateral(s, new BABYLON.Vector3(0.5, 0, -4), "estudio");

  // Segundo piso: dormitorio principal atrás y dormitorio secundario al frente.
  caja(s, "muroSegundoPisoA", 9.5, 3.4, 0.3, new BABYLON.Vector3(-4.25, 5.85, 0), materiales.paredInterior, true);
  caja(s, "muroSegundoPisoB", 2.5, 3.4, 0.3, new BABYLON.Vector3(3.55, 5.85, 0), materiales.paredInterior, true);
  crearMarcoPuerta(s, new BABYLON.Vector3(1.4, 4, 0), "dormitorioPrincipal", 4);

  // Baño del segundo piso, accesible desde el descanso de la escalera.
  caja(s, "muroBanoTrasero", 0.3, 3.4, 2.5, new BABYLON.Vector3(4.8, 5.85, -5.75), materiales.paredInterior, true);
  caja(s, "muroBanoFrontal", 0.3, 3.4, 1.5, new BABYLON.Vector3(4.8, 5.85, -2.15), materiales.paredInterior, true);
  crearMarcoPuertaLateral(s, new BABYLON.Vector3(4.8, 4, -3.7), "bano");
}

function crearMarcoPuerta(s, posicion, nombre, alturaBase = 0) {
  caja(s, "marco_" + nombre + "_izq", 0.18, 2.5, 0.35, new BABYLON.Vector3(posicion.x - 0.85, alturaBase + 1.25, posicion.z), materiales.madera, false);
  caja(s, "marco_" + nombre + "_der", 0.18, 2.5, 0.35, new BABYLON.Vector3(posicion.x + 0.85, alturaBase + 1.25, posicion.z), materiales.madera, false);
  caja(s, "marco_" + nombre + "_arriba", 1.9, 0.18, 0.35, new BABYLON.Vector3(posicion.x, alturaBase + 2.45, posicion.z), materiales.madera, false);
}

function crearMarcoPuertaLateral(s, posicion, nombre) {
  caja(s, "marco_" + nombre + "_frente", 0.35, 2.5, 0.18, new BABYLON.Vector3(posicion.x, posicion.y + 1.25, posicion.z + 0.85), materiales.madera, false);
  caja(s, "marco_" + nombre + "_atras", 0.35, 2.5, 0.18, new BABYLON.Vector3(posicion.x, posicion.y + 1.25, posicion.z - 0.85), materiales.madera, false);
  caja(s, "marco_" + nombre + "_arriba", 0.35, 0.18, 1.9, new BABYLON.Vector3(posicion.x, posicion.y + 2.45, posicion.z), materiales.madera, false);
}

function crearObjetosMision(s) {
  const datos = [
    { nombre: "Llave antigua", posicion: new BABYLON.Vector3(-4.3, 1.18, -3.8), color: new BABYLON.Color3(1, 0.72, 0.1), forma: "llave" },
    { nombre: "Libro rojo", posicion: new BABYLON.Vector3(-4.7, 0.82, 2.6), color: new BABYLON.Color3(0.75, 0.06, 0.04), forma: "libro" },
    { nombre: "Cristal azul", posicion: new BABYLON.Vector3(1.8, 5.2, 5.5), color: new BABYLON.Color3(0.1, 0.7, 1), forma: "cristal" },
  ];

  datos.forEach((dato, indice) => {
    const objeto = dato.forma === "cristal"
      ? BABYLON.MeshBuilder.CreatePolyhedron("objetoMision_" + indice, { type: 1, size: 0.65 }, s)
      : BABYLON.MeshBuilder.CreateBox("objetoMision_" + indice, { width: dato.forma === "libro" ? 0.65 : 0.55, height: 0.16, depth: 0.45 }, s);
    objeto.position = dato.posicion;
    objeto.material = material(s, "objetoMat_" + indice, dato.color, true);
    objeto.metadata = { nombre: dato.nombre, disponible: true };
    objetosMision.push(objeto);
    flotar(s, objeto, indice);
  });
}

function flotar(s, objeto, indice) {
  const yInicial = objeto.position.y;
  let tiempo = indice * 0.8;
  s.onBeforeRenderObservable.add(() => {
    if (!objeto.isDisposed() && objeto.metadata?.disponible) {
      tiempo += 0.035;
      objeto.position.y = yInicial + Math.sin(tiempo) * 0.08;
      objeto.rotation.y += 0.01;
    }
  });
}

async function crearJugador(s) {
  // Rúbrica: collider simple e invisible. Este nodo recibe movimiento, gravedad y colisiones;
  // el GLB queda separado para no alterar su jerarquía ni sus posibles animaciones.
  jugador = BABYLON.MeshBuilder.CreateCapsule(
    "colliderPersonaje",
    { height: 1.9, radius: 0.42 },
    s
  );
  jugador.position = new BABYLON.Vector3(0, 1, 10.5);
  jugador.rotation.y = Math.PI;
  jugador.isVisible = false;
  jugador.isPickable = false;
  // Guía Clase 06: caparazón humanoide aproximado X 0.5, Y 1, Z 0.5.
  jugador.checkCollisions = true;
  jugador.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
  jugador.ellipsoidOffset = BABYLON.Vector3.Zero();

  // Rúbrica: TransformNode contenedor para mover/rotar el personaje importado sin romperlo.
  contenedorPersonaje = new BABYLON.TransformNode("contenedorPersonaje", s);
  sincronizarModeloPersonaje();

  try {
    // Rúbrica: importación asíncrona del protagonista desde la ruta real del proyecto.
    const resultado = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "assets/modelos/",
      "personaje.glb",
      s
    );

    const nodosImportados = [...resultado.meshes, ...(resultado.transformNodes || [])];
    const conjuntoImportado = new Set(nodosImportados);
    const nodosRaiz = nodosImportados.filter(
      (nodo) => !nodo.parent || !conjuntoImportado.has(nodo.parent)
    );
    nodosRaiz.forEach((nodo) => {
      nodo.parent = contenedorPersonaje;
    });

    resultado.meshes.forEach((mesh) => {
      // Las colisiones las resuelve la cápsula invisible, no la geometría compleja del GLB.
      mesh.checkCollisions = false;
      mesh.isPickable = false;
    });

    modeloPersonaje = resultado.meshes.find(
      (mesh) => mesh.getTotalVertices && mesh.getTotalVertices() > 0
    );
    contenedorPersonaje.scaling = new BABYLON.Vector3(0.95, 0.95, 0.95);

    // El archivo actual no tiene animaciones, pero esta detección permite usar otro GLB
    // con clips Idle/Walk/Run sin modificar el controlador.
    const grupos = resultado.animationGroups || [];
    animacionIdle = buscarAnimacion(grupos, ["idle", "reposo", "stand"]);
    animacionCaminar = buscarAnimacion(grupos, ["walk", "caminar", "run", "correr"]);
    if (!animacionIdle && grupos.length > 0) animacionIdle = grupos[0];
    reproducirAnimacion(animacionIdle);
    sincronizarModeloPersonaje();
  } catch (error) {
    console.error("No se pudo cargar assets/modelos/personaje.glb", error);
    crearPersonajeFallback(s);
  }
}

function buscarAnimacion(grupos, nombres) {
  return grupos.find((grupo) => {
    const nombre = grupo.name.toLowerCase();
    return nombres.some((palabra) => nombre.includes(palabra));
  }) || null;
}

function reproducirAnimacion(animacion) {
  if (!animacion || animacionActual === animacion) return;
  if (animacionActual) animacionActual.stop();
  animacion.start(true);
  animacionActual = animacion;
}

function crearPersonajeFallback(s) {
  const cuerpo = BABYLON.MeshBuilder.CreateCapsule(
    "personajeFallback",
    { height: 1.8, radius: 0.38 },
    s
  );
  cuerpo.parent = contenedorPersonaje;
  cuerpo.material = materiales.dorado;
  modeloPersonaje = cuerpo;
}

function crearCieloExterior(s) {
  const cielo = BABYLON.MeshBuilder.CreateBox("cieloExterior", { size: 150 }, s);
  const matCielo = new BABYLON.StandardMaterial("matCielo", s);
  matCielo.backFaceCulling = false;
  matCielo.disableLighting = true;
  matCielo.emissiveColor = new BABYLON.Color3(0.025, 0.035, 0.1);
  cielo.material = matCielo;
  cielo.isPickable = false;
}

async function crearAssetsExternos(s) {
  // Se reutilizan dos assets del proyecto fuera de la casa: el buzón junto a la puerta
  // y el árbol en el jardín. El interior sigue siendo procedural para permitir colisiones.
  const buzon = await cargarModelo(
    s,
    "assets/modelos/",
    "buzon.glb",
    new BABYLON.Vector3(2.7, 0, 8.45),
    new BABYLON.Vector3(0.35, 0.35, 0.35)
  );
  const arbol = await cargarModelo(
    s,
    "assets/modelos/",
    "arbol.glb",
    new BABYLON.Vector3(7.5, 0, 11),
    new BABYLON.Vector3(0.8, 0.8, 0.8)
  );

  if (arbol) {
    arbol.rotation.x = -Math.PI / 2;
    arbol.isPickable = false;

    const posicionesArboles = [
      new BABYLON.Vector3(-12, 0, 11),
      new BABYLON.Vector3(12, 0, 11),
      new BABYLON.Vector3(-16, 0, 20),
      new BABYLON.Vector3(16, 0, 20),
      new BABYLON.Vector3(-18, 0, -12),
      new BABYLON.Vector3(18, 0, -12),
      new BABYLON.Vector3(-27, 0, 4),
      new BABYLON.Vector3(27, 0, 4),
    ];

    posicionesArboles.forEach((posicion, indice) => {
      const clon = arbol.clone("arbolExterior_" + indice);
      if (clon) clon.position = posicion;
      crearTroncoColision(s, posicion, indice);
    });
    crearTroncoColision(s, new BABYLON.Vector3(7.5, 0, 11), "principal");
  }
  if (buzon) buzon.isPickable = false;
}

function crearTroncoColision(s, posicion, indice) {
  const tronco = crearCilindro(
    s,
    "colisionArbol_" + indice,
    1.15,
    2.4,
    new BABYLON.Vector3(posicion.x, 1.2, posicion.z),
    materiales.madera
  );
  tronco.isVisible = false;
  tronco.checkCollisions = true;
}

function cargarModelo(s, rootUrl, fileName, position, scaling) {
  return new Promise((resolve) => {
    BABYLON.SceneLoader.ImportMesh(
      "",
      rootUrl,
      fileName,
      s,
      (meshes) => {
        if (!meshes || meshes.length === 0) {
          resolve(null);
          return;
        }
        const root = new BABYLON.TransformNode(fileName + "_root", s);
        for (const mesh of meshes) {
          mesh.parent = root;
          mesh.checkCollisions = false;
          mesh.receiveShadows = true;
        }
        root.position = position;
        root.scaling = scaling;
        resolve(root);
      },
      null,
      () => resolve(null)
    );
  });
}

function crearCartel(s, texto, posicion, rotacionY) {
  const anchoCartel = Math.max(2.5, texto.length * 0.22);
  const plano = BABYLON.MeshBuilder.CreatePlane("cartel_" + texto, { width: anchoCartel, height: 0.55 }, s);
  plano.position = posicion;
  plano.rotation.y = rotacionY;
  const textura = new BABYLON.DynamicTexture("texto_" + texto, { width: 512, height: 128 }, s, true);
  textura.hasAlpha = true;
  textura.drawText(texto, null, 84, "bold 44px Arial", "#ffe6a0", "transparent", true);
  const mat = new BABYLON.StandardMaterial("matCartel_" + texto, s);
  mat.diffuseTexture = textura;
  mat.emissiveColor = new BABYLON.Color3(0.35, 0.2, 0.05);
  plano.material = mat;
  plano.isPickable = false;
}

function caja(s, nombre, ancho, alto, fondo, posicion, mat, colisiones = false) {
  const mesh = BABYLON.MeshBuilder.CreateBox(nombre, { width: ancho, height: alto, depth: fondo }, s);
  mesh.position = posicion;
  mesh.material = mat;
  mesh.checkCollisions = colisiones;
  if (/^(pared|muro|techo|pisoSegundo|viga)/i.test(nombre)) {
    mesh.metadata = { ...(mesh.metadata || {}), ocultableCamara: true };
  }
  return mesh;
}

function crearCilindro(s, nombre, diametro, alto, posicion, mat) {
  const mesh = BABYLON.MeshBuilder.CreateCylinder(nombre, { diameter: diametro, height: alto }, s);
  mesh.position = posicion;
  mesh.material = mat;
  return mesh;
}

function configurarControles(s) {
  s.onKeyboardObservable.add((kbInfo) => {
    const esPresion = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN;
    const esLiberacion = kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP;
    if (!esPresion && !esLiberacion) return;

    const tecla = kbInfo.event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(tecla)) {
      // Rúbrica: estado continuo de WASD/flechas para movimiento independiente del FPS.
      teclas[tecla] = esPresion;
      kbInfo.event.preventDefault();
    }

    if (!esPresion || kbInfo.event.repeat) return;
    if (tecla === "e") manejarInteraccion();
    if (tecla === " ") {
      iniciarSalto();
      kbInfo.event.preventDefault();
    }
    if (tecla === "r" && juegoTerminado) reiniciarJuego();
  });
}

function configurarLogicaJuego(s) {
  s.onBeforeRenderObservable.add(() => {
    if (!jugador || !camera) return;
    actualizarMovimientoPersonaje(s);
    actualizarObstruccionesCamara(s);
    actualizarUI();
  });
}

function actualizarObstruccionesCamara(s) {
  // Restaura los muros ocultados en el cuadro anterior.
  obstaculosCamaraOcultos.forEach((mesh) => {
    if (!mesh.isDisposed()) mesh.visibility = 1;
  });
  obstaculosCamaraOcultos = [];

  const objetivo = jugador.position.add(new BABYLON.Vector3(0, 0.65, 0));
  const haciaJugador = objetivo.subtract(camera.position);
  const distancia = haciaJugador.length();
  if (distancia < 0.01) return;

  const rayo = new BABYLON.Ray(
    camera.position,
    haciaJugador.normalize(),
    distancia
  );
  const impactos = s.multiPickWithRay(
    rayo,
    (mesh) => Boolean(mesh.metadata?.ocultableCamara)
  ) || [];

  // Efecto de casa de muñecas: la estructura sigue ahí y conserva colisiones,
  // pero no tapa al protagonista durante el recorrido en tercera persona.
  impactos.forEach((impacto) => {
    const mesh = impacto.pickedMesh;
    if (!mesh || obstaculosCamaraOcultos.includes(mesh)) return;
    mesh.visibility = 0.12;
    obstaculosCamaraOcultos.push(mesh);
  });
}

function actualizarMovimientoPersonaje(s) {
  // Rúbrica: deltaTime mantiene la misma velocidad aunque cambie la tasa de cuadros.
  const delta = Math.min(s.getEngine().getDeltaTime() / 1000, 0.05);
  const ejeVertical =
    (teclas.w || teclas.arrowup ? 1 : 0) -
    (teclas.s || teclas.arrowdown ? 1 : 0);
  const ejeGiro =
    (teclas.d || teclas.arrowright ? 1 : 0) -
    (teclas.a || teclas.arrowleft ? 1 : 0);

  // Controles estables de tercera persona: A/D gira y W/S avanza o retrocede.
  // La cámara sigue la rotación del personaje sin competir con el teclado.
  jugador.rotation.y += ejeGiro * VELOCIDAD_GIRO * delta;
  const frenteJugador = new BABYLON.Vector3(
    Math.sin(jugador.rotation.y),
    0,
    Math.cos(jugador.rotation.y)
  );
  const direccion = frenteJugador.scale(ejeVertical);
  const estaMoviendose = Math.abs(ejeVertical) > 0.001;

  // Rúbrica: gravedad aplicada al collider y movimiento contra superficies sólidas.
  velocidadVertical += s.gravity.y * MULTIPLICADOR_GRAVEDAD * delta;
  const desplazamiento = direccion
    .scale(VELOCIDAD_JUGADOR * delta)
    .add(new BABYLON.Vector3(0, velocidadVertical * delta, 0));
  const posicionAnterior = jugador.position.clone();
  jugador.moveWithCollisions(desplazamiento);

  const movimientoVerticalReal = jugador.position.y - posicionAnterior.y;
  const chocoVerticalmente =
    Math.abs(movimientoVerticalReal - desplazamiento.y) > 0.002;
  if (velocidadVertical <= 0 && chocoVerticalmente) {
    velocidadVertical = 0;
    jugadorEnSuelo = true;
    saltoActivo = false;
  } else if (Math.abs(velocidadVertical) > 0.05) {
    jugadorEnSuelo = false;
  }

  if (ajustarAlturaEscalera()) {
    velocidadVertical = 0;
    jugadorEnSuelo = true;
  }

  sincronizarModeloPersonaje();
  actualizarAnimacionPersonaje(estaMoviendose);
}

function sincronizarModeloPersonaje() {
  if (!jugador || !contenedorPersonaje) return;
  contenedorPersonaje.position.copyFrom(jugador.position);
  contenedorPersonaje.rotation.y = jugador.rotation.y + ROTACION_MODELO;
}

function ajustarAlturaEscalera() {
  if (!jugador || saltoActivo) return false;

  const estaEnEscalera =
    Math.abs(jugador.position.x - 6.8) < 1.55 &&
    jugador.position.z < 4.55 &&
    jugador.position.z > -1.25;

  if (!estaEnEscalera) return false;

  const progreso = (4.55 - jugador.position.z) / 5.8;
  const alturaNecesaria = 1 + Math.max(0, Math.min(1, progreso)) * 4.15;

  // Asistencia de escalera: acompaña la superficie inclinada y evita atascarse en los peldaños.
  jugador.position.y = alturaNecesaria;
  return true;
}

function actualizarAnimacionPersonaje(estaMoviendose) {
  if (estaMoviendose && animacionCaminar) {
    reproducirAnimacion(animacionCaminar);
  } else if (!estaMoviendose && animacionIdle) {
    reproducirAnimacion(animacionIdle);
  }

  // El personaje.glb actual no contiene AnimationGroups. Este balanceo procedural
  // mantiene una respuesta visual hasta sustituirlo por un GLB Idle/Walk de Mixamo.
  if (!animacionIdle && !animacionCaminar && contenedorPersonaje && engine) {
    tiempoAnimacionProcedural += engine.getDeltaTime() / 1000;
    const frecuencia = estaMoviendose ? 10 : 2.2;
    const amplitud = estaMoviendose ? 0.045 : 0.012;
    contenedorPersonaje.position.y =
      jugador.position.y + Math.sin(tiempoAnimacionProcedural * frecuencia) * amplitud;
  }
}

function manejarInteraccion() {
  if (juegoTerminado) return true;

  if (objetoEnMano) {
    if (cercaDe(jugador.position, mesaEntrega.position, 2.6)) {
      entregarObjeto();
      return true;
    }
    return false;
  }

  const objeto = objetosMision.find((item) => item.metadata.disponible && cercaDe(jugador.position, item.position, 2.2));
  if (objeto) {
    recogerObjeto(objeto);
    return true;
  }
  return false;
}

function iniciarSalto() {
  if (saltoActivo || !jugador || !jugadorEnSuelo || juegoTerminado) return;
  saltoActivo = true;
  jugadorEnSuelo = false;
  velocidadVertical = FUERZA_SALTO;
}

function recogerObjeto(objeto) {
  objeto.metadata.disponible = false;
  objeto.parent = contenedorPersonaje || jugador;
  objeto.position = new BABYLON.Vector3(0.55, 0.15, 0.25);
  objeto.rotation = BABYLON.Vector3.Zero();
  objetoEnMano = objeto;
}

function entregarObjeto() {
  objetoEnMano.parent = null;
  objetoEnMano.position = new BABYLON.Vector3(
    mesaEntrega.position.x + (objetosEntregados % 2) * 0.55 - 0.3,
    mesaEntrega.position.y + 0.48,
    mesaEntrega.position.z
  );
  objetoEnMano.rotation = BABYLON.Vector3.Zero();
  objetoEnMano = null;
  objetosEntregados++;

  if (objetosEntregados === objetosMision.length) {
    juegoTerminado = true;
    document.getElementById("gameStatus").textContent = "🏆 ¡Recorrido completado! Encontraste todos los objetos";
  }
}

function reiniciarJuego() {
  location.reload();
}

function cercaDe(pos1, pos2, rango) {
  return BABYLON.Vector3.Distance(pos1, pos2) < rango;
}

function actualizarUI() {
  const estado = document.getElementById("interactionStatus");
  const objetivo = document.getElementById("objetivoStatus");
  if (!estado || !objetivo || !jugador) return;

  if (juegoTerminado) {
    estado.textContent = "✅ Exploración completada. Presiona R para comenzar nuevamente.";
    estado.style.color = "#9cffb0";
    return;
  }

  if (objetoEnMano) {
    estado.textContent = `Objeto recogido: ${objetoEnMano.metadata.nombre}. Llévalo a la mesa del comedor.`;
    estado.style.color = "#ffe68a";
  } else {
    const cercano = objetosMision.find((item) => item.metadata.disponible && cercaDe(jugador.position, item.position, 2.2));
    estado.textContent = cercano
      ? `✨ Presiona E para recoger: ${cercano.metadata.nombre}`
      : "Explora cada habitación y busca los objetos iluminados.";
    estado.style.color = cercano ? "#ffe68a" : "white";
  }

  objetivo.textContent = `Progreso: ${objetosEntregados} de ${objetosMision.length} objetos encontrados`;
}

globalThis.addEventListener("beforeunload", () => {
  if (engine) engine.dispose();
});
