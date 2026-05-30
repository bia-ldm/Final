const alunos = [];

const situacoesMap = new Map([
  ["APROVADO", "Aprovado"],
  ["RECUPERACAO", "Em recuperação"],
  ["REPROVADO", "Reprovado"]
]);

let indiceAlunoSelecionado = null;
let desafioAtual = null;
let tentativasRestantes = 3;

// elementos da DOM

const form = document.getElementById("form-estudante");
const alertaErro = document.getElementById("alerta-erro");

const tabelaBody = document.querySelector("#tabela-alunos tbody");
const cardsAlunosContainer = document.getElementById("cards-alunos");

const buscaNomeInput = document.getElementById("busca-nome");
const filtroStatusSelect = document.getElementById("filtro-status");

const nomeSelecionadoSpan = document.getElementById("nome-selecionado");
const mediaSelecionadaSpan = document.getElementById("media-selecionada");
const perguntaDesafioDiv = document.getElementById("pergunta-desafio");
const respostaDesafioInput = document.getElementById("resposta-desafio");
const feedbackDesafioDiv = document.getElementById("feedback-desafio");
const btnVerificarDesafio = document.getElementById("btn-verificar-desafio");
const btnNovoDesafio = document.getElementById("btn-novo-desafio");

const btnToggleDark = document.getElementById("toggle-dark");

// calcula média ponderada com pesos 3, 3 e 4 para as notas respectivamente

function calcularMediaPonderada(n1, n2, n3) {
  const peso1 = 3;
  const peso2 = 3;
  const peso3 = 4;
  const somaPesos = peso1 + peso2 + peso3;

  const media = (n1 * peso1 + n2 * peso2 + n3 * peso3) / somaPesos;
  return Number(media.toFixed(2));
}

function calcularFrequencia(presencas, aulasTotais) {
  const freq = (presencas / aulasTotais) * 100;
  return Number(freq.toFixed(1));
}

function determinarSituacao(media, frequencia) {
  if (media >= 7 && frequencia >= 75) {
    return "APROVADO";
  } else if (media >= 5) {
    return "RECUPERACAO";
  } else {
    return "REPROVADO";
  }
}

function determinarConceito(media) {
  let conceito;
  switch (true) {
    case media >= 9:
      conceito = "A";
      break;
    case media >= 7:
      conceito = "B";
      break;
    case media >= 5:
      conceito = "C";
      break;
    default:
      conceito = "D";
  }
  return conceito;
}

function validarNumero(valor, min, max, campo) {
  if (Number.isNaN(valor)) {
    throw new Error(`O campo "${campo}" deve ser um número válido.`);
  }
  if (valor < min || valor > max) {
    if (max === Infinity) {
      throw new Error(`O campo "${campo}" deve ser maior ou igual a ${min}.`);
    } else {
      throw new Error(`O campo "${campo}" deve estar entre ${min} e ${max}.`);
    }
  }
}

function limitarDecimais(input) {
  input.addEventListener("input", () => {
    if (input.value.includes(".")) {
      const partes = input.value.split(".");
      partes[1] = partes[1].slice(0, 2);
      input.value = partes.join(".");
    }
  });
}

// numero do telefone determinado
function aplicarMascaraTelefone(input) {
  input.addEventListener("input", () => {
    let valor = input.value.replace(/\D/g, ""); // só dígitos

    if (valor.length > 11) {
      valor = valor.slice(0, 11);
    }

    if (valor.length > 2 && valor.length <= 7) {
      valor = `${valor.slice(0, 2)} ${valor.slice(2)}`;
    } else if (valor.length > 7) {
      valor = `${valor.slice(0, 2)} ${valor.slice(2, 7)}-${valor.slice(7)}`;
    }

    input.value = valor;
  });
}

function validarTelefoneFormato(telefone) {
  const regex = /^\d{2} \d{5}-\d{4}$/;
  if (!regex.test(telefone)) {
    throw new Error(
      'O telefone deve estar no formato "xx xxxxx-xxxx".'
    );
  }
}

// limitar decimais e numeros 

limitarDecimais(document.getElementById("nota1"));
limitarDecimais(document.getElementById("nota2"));
limitarDecimais(document.getElementById("nota3"));
aplicarMascaraTelefone(document.getElementById("telefone"));

form.addEventListener("submit", (event) => {
  event.preventDefault();

  alertaErro.classList.add("hidden");
  alertaErro.textContent = "";

  try {
    const nome = document.getElementById("nome").value.trim();
    const nota1 = Number(document.getElementById("nota1").value);
    const nota2 = Number(document.getElementById("nota2").value);
    const nota3 = Number(document.getElementById("nota3").value);
    const presencas = Number(document.getElementById("presencas").value);
    const aulasTotais = Number(document.getElementById("aulasTotais").value);
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim() || null;

    if (!nome) {
      throw new Error("O nome do aluno é obrigatório.");
    }

    validarNumero(nota1, 0, 10, "Nota 1");
    validarNumero(nota2, 0, 10, "Nota 2");
    validarNumero(nota3, 0, 10, "Nota 3");
    validarNumero(presencas, 0, Infinity, "Total de presenças");
    validarNumero(aulasTotais, 1, Infinity, "Aulas totais");

    if (presencas > aulasTotais) {
      throw new Error("Presenças não podem ser maiores que as aulas totais.");
    }

    validarTelefoneFormato(telefone);

    const media = calcularMediaPonderada(nota1, nota2, nota3);
    const frequencia = calcularFrequencia(presencas, aulasTotais);
    const situacao = determinarSituacao(media, frequencia);
    const conceito = determinarConceito(media);

    const aluno = {
      nome,
      notas: { nota1, nota2, nota3 },
      presencas,
      aulasTotais,
      media,
      frequencia,
      situacao,
      conceito,
      responsavel: {
        telefone,
        email
      }
    };

    alunos.push(aluno);
    form.reset();
    renderizarLista();
  } catch (erro) {
    alertaErro.textContent = erro.message;
    alertaErro.classList.remove("hidden");
  }
});

// alunos e situação

function renderizarLista() {
  tabelaBody.innerHTML = "";
  cardsAlunosContainer.innerHTML = "";

  const termoBusca = buscaNomeInput.value.trim().toLowerCase();
  const filtroStatus = filtroStatusSelect.value;

  for (const [indice, aluno] of alunos.entries()) {
    if (termoBusca && !aluno.nome.toLowerCase().includes(termoBusca)) {
      continue;
    }
    if (filtroStatus && aluno.situacao !== filtroStatus) {
      continue;
    }

    // TABELA DE ALUNOS E SITUAÇÃO
    const tr = document.createElement("tr");
    tr.dataset.indice = indice;

    const tdNome = document.createElement("td");
    tdNome.textContent = aluno.nome;

    const tdMedia = document.createElement("td");
    tdMedia.textContent = aluno.media.toFixed(2);

    const tdFreq = document.createElement("td");
    tdFreq.textContent = aluno.frequencia.toFixed(1) + "%";

    const tdSituacao = document.createElement("td");
    const situacaoExtenso = situacoesMap.get(aluno.situacao) || "Indefinida";
    tdSituacao.textContent = situacaoExtenso;

    if (aluno.situacao === "APROVADO") {
      tdSituacao.classList.add("status-aprovado");
    } else if (aluno.situacao === "RECUPERACAO") {
      tdSituacao.classList.add("status-recuperacao");
    } else {
      tdSituacao.classList.add("status-reprovado");
    }

    const tdConceito = document.createElement("td");
    tdConceito.textContent = aluno.conceito;

    const tdTelefone = document.createElement("td");
    tdTelefone.textContent = aluno.responsavel?.telefone || "-";

    const tdEmail = document.createElement("td");
    tdEmail.textContent =
      aluno.responsavel?.email ?? "E-mail não informado";

    tr.appendChild(tdNome);
    tr.appendChild(tdMedia);
    tr.appendChild(tdFreq);
    tr.appendChild(tdSituacao);
    tr.appendChild(tdConceito);
    tr.appendChild(tdTelefone);
    tr.appendChild(tdEmail);

    tr.addEventListener("click", () => selecionarAluno(indice));
    tabelaBody.appendChild(tr);

    // CARDS DE ALUNOS E SITUAÇÃO
    const card = document.createElement("div");
    card.className = "card-aluno";
    card.dataset.indice = indice;

    const header = document.createElement("div");
    header.className = "card-aluno-header";

    const nomeSpan = document.createElement("span");
    nomeSpan.className = "card-aluno-nome";
    nomeSpan.textContent = aluno.nome;

    const tagSpan = document.createElement("span");
    tagSpan.className = "card-aluno-tag";
    tagSpan.textContent = situacaoExtenso;

    if (aluno.situacao === "APROVADO") {
      tagSpan.style.background = "#e8f5e9";
      tagSpan.style.color = "#1b5e20";
    } else if (aluno.situacao === "RECUPERACAO") {
      tagSpan.style.background = "#fff8e1";
      tagSpan.style.color = "#f9a825";
    } else {
      tagSpan.style.background = "#ffebee";
      tagSpan.style.color = "#c62828";
    }

    header.appendChild(nomeSpan);
    header.appendChild(tagSpan);

    const body = document.createElement("div");
    body.className = "card-aluno-body";
    body.innerHTML = `
      <span><strong>Média:</strong> ${aluno.media.toFixed(2)}</span>
      <span><strong>Freq.:</strong> ${aluno.frequencia.toFixed(1)}%</span>
      <span><strong>Conceito:</strong> ${aluno.conceito}</span>
      <span><strong>Tel.:</strong> ${aluno.responsavel?.telefone || "-"}</span>
      <span><strong>E-mail:</strong> ${
        aluno.responsavel?.email ?? "E-mail não informado"
      }</span>
    `;

    card.appendChild(header);
    card.appendChild(body);

    card.addEventListener("click", () => selecionarAluno(indice));
    cardsAlunosContainer.appendChild(card);
  }
}

buscaNomeInput.addEventListener("input", renderizarLista);
filtroStatusSelect.addEventListener("change", renderizarLista);

// gamificação

function selecionarAluno(indice) {
  indiceAlunoSelecionado = indice;
  tentativasRestantes = 3;

  const aluno = alunos[indice];
  nomeSelecionadoSpan.textContent = aluno.nome;
  mediaSelecionadaSpan.textContent = aluno.media.toFixed(2);

  feedbackDesafioDiv.textContent = "";
  feedbackDesafioDiv.className = "feedback";
  btnNovoDesafio.style.display = "none";

  gerarNovoDesafio();
}

function gerarNovoDesafio() {
  if (indiceAlunoSelecionado === null) {
    perguntaDesafioDiv.textContent =
      "Selecione um aluno na lista para iniciar o desafio.";
    desafioAtual = null;
    return;
  }

  tentativasRestantes = 3;
  feedbackDesafioDiv.textContent = "";
  feedbackDesafioDiv.className = "feedback";
  btnNovoDesafio.style.display = "none";

  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const operacoes = ["+", "-", "*"];
  const op = operacoes[Math.floor(Math.random() * operacoes.length)];

  let resultado;
  if (op === "+") resultado = a + b;
  if (op === "-") resultado = a - b;
  if (op === "*") resultado = a * b;

  desafioAtual = { a, b, op, resultado };

  perguntaDesafioDiv.textContent = `Quanto é ${a} ${op} ${b}?`;
  respostaDesafioInput.value = "";
}

btnVerificarDesafio.addEventListener("click", () => {
  if (indiceAlunoSelecionado === null) {
    feedbackDesafioDiv.textContent =
      "Nenhum aluno selecionado. Clique em um aluno na lista.";
    feedbackDesafioDiv.className = "feedback erro";
    return;
  }

  if (!desafioAtual) {
    feedbackDesafioDiv.textContent =
      "Nenhum desafio ativo. Gere um novo desafio.";
    feedbackDesafioDiv.className = "feedback erro";
    return;
  }

  const respostaUsuario = Number(respostaDesafioInput.value);

  if (Number.isNaN(respostaUsuario)) {
    feedbackDesafioDiv.textContent = "Digite um número válido.";
    feedbackDesafioDiv.className = "feedback erro";
    return;
  }

  if (respostaUsuario === desafioAtual.resultado) {
    feedbackDesafioDiv.textContent =
      "Correto! +0.5 ponto de bônus na média do aluno.";
    feedbackDesafioDiv.className = "feedback ok";

    const aluno = alunos[indiceAlunoSelecionado];
    aluno.media = Number((aluno.media + 0.5).toFixed(2));
    aluno.conceito = determinarConceito(aluno.media);
    aluno.situacao = determinarSituacao(aluno.media, aluno.frequencia);

    mediaSelecionadaSpan.textContent = aluno.media.toFixed(2);
    renderizarLista();

    btnNovoDesafio.style.display = "block";
    return;
  }

  tentativasRestantes--;

  if (tentativasRestantes > 0) {
    feedbackDesafioDiv.textContent =
      `Resposta incorreta. Você tem mais ${tentativasRestantes} tentativa(s).`;
    feedbackDesafioDiv.className = "feedback erro";
  } else {
    feedbackDesafioDiv.textContent =
      "Você esgotou suas tentativas. Clique em \"Novo desafio\" para tentar outra conta.";
    feedbackDesafioDiv.className = "feedback erro";
    btnNovoDesafio.style.display = "block";
  }
});

btnNovoDesafio.addEventListener("click", () => {
  gerarNovoDesafio();
});

// modo escuro

btnToggleDark.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});


renderizarLista();
gerarNovoDesafio();

