// Array global de alunos
const alunos = [];

// Map de situações do sistema
// chave interna -> texto por extenso
const situacoesMap = new Map([
  ["APROVADO", "Aprovado"],
  ["RECUPERACAO", "Em recuperação"],
  ["REPROVADO", "Reprovado"]
]);

// Estado da gamificação
let indiceAlunoSelecionado = null;
let desafioAtual = null;

// Referências de DOM
const form = document.getElementById("form-estudante");
const alertaErro = document.getElementById("alerta-erro");
const tabelaBody = document.querySelector("#tabela-alunos tbody");
const buscaNomeInput = document.getElementById("busca-nome");
const filtroStatusSelect = document.getElementById("filtro-status");

const nomeSelecionadoSpan = document.getElementById("nome-selecionado");
const mediaSelecionadaSpan = document.getElementById("media-selecionada");
const perguntaDesafioDiv = document.getElementById("pergunta-desafio");
const respostaDesafioInput = document.getElementById("resposta-desafio");
const btnVerificarDesafio = document.getElementById("btn-verificar-desafio");
const feedbackDesafioDiv = document.getElementById("feedback-desafio");

// ---------- UTILITÁRIOS DE CÁLCULO ----------

function calcularMediaPonderada(n1, n2, n3) {
  // pesos: 3, 3, 4 (exemplo)
  const peso1 = 3;
  const peso2 = 3;
  const peso3 = 4;
  const somaPesos = peso1 + peso2 + peso3;

  const media =
    (n1 * peso1 + n2 * peso2 + n3 * peso3) / somaPesos;

  return Number(media.toFixed(2));
}

function calcularFrequencia(presencas, aulasTotais) {
  const freq = (presencas / aulasTotais) * 100;
  return Number(freq.toFixed(1));
}

function determinarSituacao(media, frequencia) {
  // regra simples: média >= 7 e freq >= 75 => aprovado
  // média entre 5 e 6.9 => recuperação
  // demais => reprovado
  if (media >= 7 && frequencia >= 75) {
    return "APROVADO";
  } else if (media >= 5) {
    return "RECUPERACAO";
  } else {
    return "REPROVADO";
  }
}

function determinarConceito(media) {
  // fluxo switch para conceito A, B, C, D
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

// ---------- FORMULÁRIO / CADASTRO ----------

form.addEventListener("submit", function (event) {
  event.preventDefault(); // impede recarregamento

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

    // Coerção e validação
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
        email // pode ser null
      }
    };

    alunos.push(aluno);
    form.reset();
    renderizarTabela();
  } catch (erro) {
    alertaErro.textContent = erro.message;
    alertaErro.classList.remove("hidden");
  }
});

function validarNumero(valor, min, max, campo) {
  if (Number.isNaN(valor)) {
    throw new Error(`O campo "${campo}" deve ser um número válido.`);
  }
  if (valor < min || valor > max) {
    if (max === Infinity) {
      throw new Error(`O campo "${campo}" deve ser maior ou igual a ${min}.`);
    } else {
      throw new Error(
        `O campo "${campo}" deve estar entre ${min} e ${max}.`
      );
    }
  }
}

// ---------- LISTAGEM / TABELA DINÂMICA ----------

function renderizarTabela() {
  tabelaBody.innerHTML = "";

  const termoBusca = buscaNomeInput.value.trim().toLowerCase();
  const filtroStatus = filtroStatusSelect.value;

  for (const [indice, aluno] of alunos.entries()) {
    // filtros
    if (termoBusca && !aluno.nome.toLowerCase().includes(termoBusca)) {
      continue;
    }
    if (filtroStatus && aluno.situacao !== filtroStatus) {
      continue;
    }

    const tr = document.createElement("tr");
    tr.dataset.indice = indice;

    const tdNome = document.createElement("td");
    tdNome.textContent = aluno.nome;

    const tdMedia = document.createElement("td");
    tdMedia.textContent = aluno.media.toFixed(2);

    const tdFreq = document.createElement("td");
    tdFreq.textContent = aluno.frequencia.toFixed(1) + "%";

    const tdSituacao = document.createElement("td");
    // situação por extenso vinda do Map
    const situacaoExtenso = situacoesMap.get(aluno.situacao) || "Indefinida";
    tdSituacao.textContent = situacaoExtenso;

    const tdConceito = document.createElement("td");
    tdConceito.textContent = aluno.conceito;

    const tdTelefone = document.createElement("td");
    tdTelefone.textContent = aluno.responsavel?.telefone || "-";

    const tdEmail = document.createElement("td");
    // encadeamento opcional + coalescência nula
    tdEmail.textContent =
      aluno.responsavel?.email ?? "E-mail não informado";

    tr.appendChild(tdNome);
    tr.appendChild(tdMedia);
    tr.appendChild(tdFreq);
    tr.appendChild(tdSituacao);
    tr.appendChild(tdConceito);
    tr.appendChild(tdTelefone);
    tr.appendChild(tdEmail);

    // clique para selecionar aluno na gamificação
    tr.addEventListener("click", () => {
      selecionarAluno(indice);
    });

    tabelaBody.appendChild(tr);
  }
}

// filtros em tempo real
buscaNomeInput.addEventListener("input", renderizarTabela);
filtroStatusSelect.addEventListener("change", renderizarTabela);

// ---------- GAMIFICAÇÃO ----------

function selecionarAluno(indice) {
  indiceAlunoSelecionado = indice;
  const aluno = alunos[indice];

  nomeSelecionadoSpan.textContent = aluno.nome;
  mediaSelecionadaSpan.textContent = aluno.media.toFixed(2);

  feedbackDesafioDiv.textContent = "";
  feedbackDesafioDiv.className = "feedback";

  gerarNovoDesafio();
}

function gerarNovoDesafio() {
  if (indiceAlunoSelecionado === null) {
    perguntaDesafioDiv.textContent =
      "Selecione um aluno na tabela para iniciar o desafio.";
    desafioAtual = null;
    return;
  }

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
      "Nenhum aluno selecionado. Clique em um aluno na tabela.";
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

    // aplica bônus na média do aluno selecionado
    const aluno = alunos[indiceAlunoSelecionado];
    aluno.media = Number((aluno.media + 0.5).toFixed(2));
    aluno.conceito = determinarConceito(aluno.media);
    aluno.situacao = determinarSituacao(aluno.media, aluno.frequencia);

    mediaSelecionadaSpan.textContent = aluno.media.toFixed(2);
    renderizarTabela();
  } else {
    feedbackDesafioDiv.textContent =
      "Resposta incorreta. Tente novamente ou gere um novo desafio.";
    feedbackDesafioDiv.className = "feedback erro";
  }

  gerarNovoDesafio();
});

// gera uma mensagem inicial na central de desafios
gerarNovoDesafio();
