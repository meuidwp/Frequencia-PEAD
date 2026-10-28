(() => {
  "use strict";

  const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const DIAS = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
  const LS_FERIADOS = "pead.feriados.v1";
  const LS_FORM = "pead.form.v1";

  // [mês, dia, descrição] — feriados nacionais de data fixa
  const NACIONAIS = [
    [1, 1, "Confraternização Universal"],
    [4, 21, "Tiradentes"],
    [5, 1, "Dia do Trabalho"],
    [9, 7, "Independência do Brasil"],
    [10, 12, "Nossa Senhora Aparecida"],
    [11, 2, "Finados"],
    [11, 15, "Proclamação da República"],
    [11, 20, "Dia da Consciência Negra"],
    [12, 25, "Natal"]
  ];

  // Locais de trabalho e seus nomes automáticos.
  // Para incluir outro local/nome, basta acrescentar aqui.
  // Com 1 nome, ele é preenchido sozinho ao escolher o local; com vários, aparecem como sugestão.
  const LOCAIS = [
    { local: "NAAS Maresias", nomes: ["Esthela Leonardo de Siqueira"] },
    { local: "CRAS Boiçucanga", nomes: [
      "Analece Neves do Nascimento",
      "Ethiene Miranda dos Santos",
      "Marie Souza Passos e Silva"
    ] }
  ];
  const TODOS_NOMES = LOCAIS.flatMap((l) => l.nomes);
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const achaLocal = (v) => LOCAIS.find((l) => norm(l.local) === norm(v));

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function load(key, def) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? def; } catch { return def; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* sem armazenamento */ }
  }

  let repo = [];                       // holidays.json do repositório
  let custom = load(LS_FERIADOS, []);  // adicionados neste aparelho
  let form = load(LS_FORM, {});

  // ---------- Datas ----------
  const toISO = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDias = (dt, n) => { const r = new Date(dt); r.setDate(r.getDate() + n); return r; };
  const brData = (s) => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

  function pascoa(y) { // algoritmo de Meeus/Jones/Butcher
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mes - 1, dia);
  }

  // ---------- Mapa de feriados do ano ----------
  function mapaFeriados(y) {
    const map = new Map();
    NACIONAIS.forEach(([m, d, desc]) => map.set(`${y}-${pad(m)}-${pad(d)}`, { tipo: "Feriado", desc }));

    const p = pascoa(y);
    map.set(toISO(addDias(p, -2)), { tipo: "Feriado", desc: "Sexta-feira Santa" });
    if (form.pfNacionais) {
      map.set(toISO(addDias(p, -48)), { tipo: "Ponto Facultativo", desc: "Carnaval" });
      map.set(toISO(addDias(p, -47)), { tipo: "Ponto Facultativo", desc: "Carnaval" });
      map.set(toISO(addDias(p, 60)), { tipo: "Ponto Facultativo", desc: "Corpus Christi" });
    }

    const aplicar = (e) => {
      if (!e || !e.data) return;
      const info = { tipo: e.tipo === "Ponto Facultativo" ? "Ponto Facultativo" : "Feriado", desc: e.desc || "" };
      if (e.anual && !e.fim) {
        const [, m, d] = e.data.split("-");
        map.set(`${y}-${m}-${d}`, info);
        return;
      }
      let cur = parseISO(e.data);
      const fim = parseISO(e.fim || e.data);
      for (let n = 0; cur <= fim && n < 366; n++) { map.set(toISO(cur), info); cur = addDias(cur, 1); }
    };
    repo.forEach(aplicar);
    custom.forEach(aplicar);
    return map;
  }

  // ---------- Folha ----------
  function folha(y, m, map) {
    const total = new Date(y, m + 1, 0).getDate();
    let linhas = "";
    for (let d = 1; d <= total; d++) {
      const dt = new Date(y, m, d);
      const dow = dt.getDay();
      const f = map.get(toISO(dt));
      const base = `<td class="c">${pad(d)}/${pad(m + 1)}/${y}</td><td class="c">${DIAS[dow]}</td>`;
      if (dow === 0 || dow === 6) {
        linhas += `<tr>${base}<td colspan="4" class="blk">${dow === 0 ? "Domingo" : "Sábado"}</td></tr>`;
      } else if (f) {
        linhas += `<tr>${base}<td colspan="4" class="blk" title="${esc(f.desc)}">${esc(f.tipo)}</td></tr>`;
      } else {
        linhas += `<tr>${base}<td></td><td></td><td></td><td></td></tr>`;
      }
    }

    return `
<article class="sheet">
  <img class="cab-img" src="assets/cabecalho.png" alt="Prefeitura de São Sebastião - Secretaria de Desenvolvimento Econômico e Social">

  <div class="tit">
    <div class="prog">Programa Emergencial de Auxílio-Desemprego - PEAD</div>
    <div class="lei">Lei nº. 1745/2005 - Decreto nº. 6720/2017</div>
    <div class="sub">Controle de Frequência do Beneficiário<br>Mês: <b>${MESES[m]}/${y}</b></div>
  </div>

  <table class="info">
    <colgroup><col style="width:68%"><col style="width:32%"></colgroup>
    <tr><th>NOME COMPLETO</th><th>Local de trabalho</th></tr>
    <tr><td>${esc(form.nome)}</td><td>${esc(form.local)}</td></tr>
  </table>

  <table class="reg">
    <colgroup><col style="width:13%"><col style="width:13%"><col style="width:18.5%"><col style="width:18.5%"><col style="width:18.5%"><col style="width:18.5%"></colgroup>
    <thead><tr><th colspan="2">DATA</th><th>ENTRADA</th><th>SAÍDA</th><th>ENTRADA</th><th>SAÍDA</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>

  <div class="ass"><div>Beneficiário</div><div>Chefia Imediata</div></div>
  <img class="rod" src="assets/rodape.png" alt="">
</article>`;
  }

  function mesInicial() {
    const v = $("mes").value;
    if (/^\d{4}-\d{2}$/.test(v)) { const [y, m] = v.split("-").map(Number); return { y, m: m - 1 }; }
    const hoje = new Date();
    return { y: hoje.getFullYear(), m: hoje.getMonth() };
  }

  function render() {
    const { y, m } = mesInicial();
    const qtd = Math.min(12, Math.max(1, parseInt($("qtd").value, 10) || 1));
    const cache = {};
    let html = "";
    for (let i = 0; i < qtd; i++) {
      const dt = new Date(y, m + i, 1);
      const ano = dt.getFullYear();
      if (!cache[ano]) cache[ano] = mapaFeriados(ano);
      html += folha(ano, dt.getMonth(), cache[ano]);
    }
    $("folhas").innerHTML = html;
    renderLista();
  }

  // ---------- Lista de feriados ----------
  function descreve(e) {
    const datas = e.fim && e.fim !== e.data ? `${brData(e.data)} a ${brData(e.fim)}` : brData(e.data) + (e.anual ? " (todo ano)" : "");
    return `${esc(datas)} — ${esc(e.tipo)}${e.desc ? ` · ${esc(e.desc)}` : ""}`;
  }

  function renderLista() {
    const itens = [
      ...repo.map((e) => `<li class="fixo"><span>${descreve(e)}</span></li>`),
      ...custom.map((e) => `<li><span>${descreve(e)}</span><button type="button" data-id="${esc(e.id)}" aria-label="Remover">✕</button></li>`)
    ];
    $("lista-feriados").innerHTML = itens.join("") || '<li class="fixo">Nenhum feriado extra cadastrado.</li>';
  }

  // ---------- Eventos ----------
  function salvarForm() {
    form = {
      nome: $("nome").value.trim(),
      local: $("local").value.trim(),
      qtd: $("qtd").value,
      pfNacionais: $("pf-nacionais").checked
    };
    save(LS_FORM, form);
  }

  // Atualiza as sugestões de nome conforme o local; "auto" preenche o nome quando possível.
  function atualizarSugestoes(auto) {
    const l = achaLocal($("local").value);
    const nomes = l ? l.nomes : TODOS_NOMES;
    $("lista-nomes").innerHTML = nomes.map((n) => `<option value="${esc(n)}">`).join("");
    if (auto && l) {
      const atual = $("nome").value.trim();
      if (!atual || TODOS_NOMES.includes(atual)) {
        if (l.nomes.length === 1) $("nome").value = l.nomes[0];
        else if (!l.nomes.includes(atual)) $("nome").value = "";
      }
    }
  }

  // Ao focar o campo, esvazia temporariamente para a lista completa aparecer
  // (o valor antigo fica como dica e volta se nada for escolhido/digitado).
  function listaSempreVisivel(el) {
    const dica = el.placeholder;
    let guardado = "";
    el.addEventListener("focus", () => {
      guardado = el.value;
      if (guardado) { el.value = ""; el.placeholder = guardado; }
    });
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Backspace" || ev.key === "Delete") guardado = ""; // apagar de propósito
    });
    el.addEventListener("input", () => { guardado = ""; });
    el.addEventListener("blur", () => {
      if (!el.value && guardado) el.value = guardado;
      guardado = "";
      el.placeholder = dica;
    });
  }

  function iniciar() {
    const hoje = new Date();
    $("mes").value = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}`;
    $("nome").value = form.nome || "";
    $("local").value = form.local || "";
    $("qtd").value = form.qtd || 1;
    $("pf-nacionais").checked = !!form.pfNacionais;

    $("lista-locais").innerHTML = LOCAIS.map((l) => `<option value="${esc(l.local)}">`).join("");
    atualizarSugestoes(false);
    listaSempreVisivel($("nome"));
    listaSempreVisivel($("local"));
    // Registrado antes do salvarForm/render para o nome já entrar na folha
    $("local").addEventListener("input", () => atualizarSugestoes(true));
    $("local").addEventListener("change", () => {
      const l = achaLocal($("local").value);
      if (l) $("local").value = l.local;   // padroniza a grafia
      atualizarSugestoes(true); salvarForm(); render();
    });

    ["mes", "qtd", "nome", "local", "pf-nacionais"].forEach((id) =>
      $(id).addEventListener("input", () => { salvarForm(); render(); })
    );

    $("form-feriado").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const data = $("f-data").value;
      const fim = $("f-fim").value;
      if (!data) return;
      if (fim && fim < data) { alert("A data final não pode ser anterior à data inicial."); return; }
      custom.push({
        id: String(Date.now()),
        data,
        fim: fim && fim !== data ? fim : "",
        tipo: $("f-tipo").value,
        desc: $("f-desc").value.trim(),
        anual: $("f-anual").checked && !fim
      });
      save(LS_FERIADOS, custom);
      ev.target.reset();
      render();
    });

    $("lista-feriados").addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-id]");
      if (!b) return;
      custom = custom.filter((e) => e.id !== b.dataset.id);
      save(LS_FERIADOS, custom);
      render();
    });

    $("btn-json").addEventListener("click", async () => {
      const lista = [...repo, ...custom].map(({ data, fim, tipo, desc, anual }) => {
        const o = { data, tipo };
        if (fim) o.fim = fim;
        if (desc) o.desc = desc;
        if (anual) o.anual = true;
        return o;
      });
      const txt = JSON.stringify(lista, null, 2);
      try { await navigator.clipboard.writeText(txt); alert("Lista copiada! Cole no arquivo holidays.json."); }
      catch { prompt("Copie o conteúdo abaixo:", txt); }
    });

    $("btn-imprimir").addEventListener("click", () => window.print());

    // Nome sugerido ao salvar como PDF
    const tituloOriginal = document.title;
    window.addEventListener("beforeprint", () => {
      const { y, m } = mesInicial();
      document.title = `Frequencia_PEAD_${MESES[m]}_${y}`;
    });
    window.addEventListener("afterprint", () => { document.title = tituloOriginal; });

    // Instalação do PWA
    let promptInstalar;
    window.addEventListener("beforeinstallprompt", (ev) => {
      ev.preventDefault();
      promptInstalar = ev;
      $("btn-install").hidden = false;
    });
    $("btn-install").addEventListener("click", async () => {
      if (!promptInstalar) return;
      promptInstalar.prompt();
      await promptInstalar.userChoice;
      promptInstalar = null;
      $("btn-install").hidden = true;
    });

    // Feriados compartilhados do repositório
    render();
    fetch("holidays.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => { repo = Array.isArray(j) ? j : []; render(); })
      .catch(() => {});

    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
