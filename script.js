// ¿Alquilar o comprar?: simulación mensual del patrimonio en los dos casos.
var CAMPOS = ['precio', 'alquiler', 'anyos', 'entrada', 'gastosCompra', 'interes', 'plazo', 'revalor', 'subida', 'rent', 'mant'];
function v(id) { return +document.getElementById(id).value || 0; }
function eur(x) { return Math.round(x).toLocaleString('es-ES') + ' €'; }

function simular() {
  var P = v('precio'), anyos = Math.max(1, Math.min(40, v('anyos'))), plazo = Math.max(1, v('plazo'));
  var entrada = P * v('entrada') / 100, gastos = P * v('gastosCompra') / 100;
  var deuda = P - entrada, i = v('interes') / 100 / 12, n = plazo * 12;
  var cuota = deuda <= 0 ? 0 : i ? deuda * i / (1 - Math.pow(1 + i, -n)) : deuda / n;
  var rMes = Math.pow(1 + v('rent') / 100, 1 / 12) - 1;
  var revMes = Math.pow(1 + v('revalor') / 100, 1 / 12) - 1;
  var alquiler = v('alquiler'), valor = P;
  var carteraAlq = entrada + gastos, carteraComp = 0;
  var serie = [{ comp: P - deuda - gastos, alq: carteraAlq }];
  for (var m = 1; m <= anyos * 12; m++) {
    var interesMes = deuda * i;
    var pago = deuda > 0 ? Math.min(cuota, deuda + interesMes) : 0;
    deuda = Math.max(0, deuda + interesMes - pago);
    var costeComprar = pago + valor * v('mant') / 100 / 12;
    var dif = costeComprar - alquiler;
    carteraAlq = carteraAlq * (1 + rMes) + Math.max(0, dif);
    carteraComp = carteraComp * (1 + rMes) + Math.max(0, -dif);
    valor *= 1 + revMes;
    if (m % 12 === 0) { alquiler *= 1 + v('subida') / 100; serie.push({ comp: valor - deuda + carteraComp, alq: carteraAlq }); }
  }
  return { serie: serie, cuota: cuota, inicial: entrada + gastos };
}

function grafica(serie) {
  var W = 700, H = 240, pad = 62;
  var max = Math.max.apply(null, serie.map(function (s) { return Math.max(s.comp, s.alq); }));
  var min = Math.min(0, Math.min.apply(null, serie.map(function (s) { return Math.min(s.comp, s.alq); })));
  var x = function (k) { return pad + k / Math.max(1, serie.length - 1) * (W - pad - 10); };
  var y = function (val) { return H - 24 - (val - min) / (max - min || 1) * (H - 40); };
  var linea = function (campo, color) {
    return '<polyline fill="none" stroke-width="2.5" stroke="' + color + '" points="' + serie.map(function (s, k) { return x(k).toFixed(1) + ',' + y(s[campo]).toFixed(1); }).join(' ') + '"/>';
  };
  var guias = [0, 0.25, 0.5, 0.75, 1].map(function (f) {
    var val = min + (max - min) * f;
    return '<line x1="' + pad + '" x2="' + W + '" y1="' + y(val) + '" y2="' + y(val) + '" stroke="currentColor" opacity=".12"/>' +
      '<text x="' + (pad - 6) + '" y="' + (y(val) + 4) + '" font-size="11" text-anchor="end" fill="currentColor" opacity=".6">' + Math.round(val / 1000).toLocaleString('es-ES') + ' mil</text>';
  }).join('');
  var anyos = serie.map(function (s, k) {
    return k % Math.ceil(serie.length / 8) === 0 || k === serie.length - 1 ? '<text x="' + x(k) + '" y="' + (H - 6) + '" font-size="11" text-anchor="middle" fill="currentColor" opacity=".6">' + k + '</text>' : '';
  }).join('');
  document.getElementById('grafica').innerHTML = guias + anyos + linea('comp', 'var(--comprar)') + linea('alq', 'var(--alquilar)');
}

function pintar() {
  var r = simular(), s = r.serie, fin = s[s.length - 1];
  var dif = fin.comp - fin.alq;
  document.getElementById('veredictoEtq').textContent = 'En ' + (s.length - 1) + ' años te conviene';
  document.getElementById('veredicto').textContent = dif >= 0 ? 'Comprar' : 'Alquilar';
  document.getElementById('veredicto').style.color = dif >= 0 ? 'var(--comprar)' : 'var(--alquilar)';
  document.getElementById('detalle').textContent = 'Tendrías ' + eur(Math.abs(dif)) + ' más (' + eur(fin.comp) + ' comprando frente a ' + eur(fin.alq) + ' alquilando)';
  document.getElementById('cuota').textContent = eur(r.cuota);
  document.getElementById('inicial').textContent = eur(r.inicial);
  var cruce = -1;
  for (var k = 1; k < s.length; k++) if (s[k].comp >= s[k].alq) { cruce = k; break; }
  document.getElementById('cruce').textContent = cruce > 0 ? 'Año ' + cruce : 'Nunca';
  document.getElementById('cruceTxt').textContent = cruce > 0 ? 'a partir de ahí, mejor comprar' : 'en este plazo';
  grafica(s);
}
CAMPOS.forEach(function (id) { document.getElementById(id).addEventListener('input', pintar); });
pintar();
