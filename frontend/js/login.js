// ============================================
// LOGIN.JS - RESPONSÁVEL PELA AUTENTICAÇÃO
// ============================================


// ============================
// 1. ELEMENTOS (DOM)
// ============================
// 👉 Sempre no topo: evita erros de "não definido"

const form = document.getElementById("loginForm");
const erroGlobal = document.getElementById("erroGlobal");
const btn = document.querySelector(".submit-btn");

const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");

const toggleSenha = document.getElementById("toggleSenha");
const inputBox = senhaInput.closest(".input-box");


// ============================
// 2. EVENTOS (INTERAÇÕES)
// ============================

// ============================================
// 📌 SUBMIT DO FORMULÁRIO (LOGIN)
// ============================================
form.addEventListener("submit", async (e) => {

    // 🛑 Evita reload da página
    e.preventDefault();

    // 🧹 Limpa estados anteriores
    limparErros();

    // 📥 Captura valores
    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();

    // ⚠️ Validação antes de chamar API
    if (!validarCampos(email, senha)) return;


    /*
    try {

        // ⏳ Estado de loading
        ativarLoading();

        // 🌐 Chamada API
        const data = await apiLogin("/auth/login", { email, senha });

        console.log("Resposta do backend:", data);

        console.log("RETORNO:", data);
        console.log("STATUS:", data.status);


        // ✅ Feedback de sucesso
        if (data.status === 200) {
            console.log("✅ Login bem-sucedido. Redirecionando para index.html...");
            window.location.href = "index.html";
        } else {
            console.error("❌ Falha no login. Status da resposta:", data.status);
        }

    } catch (err) {

        console.error("Erro ao realizar login:", err);

        // ❌ Tratamento de erro
        tratarErro(err);

    } finally {

        // 🔄 Restaura botão
        desativarLoading();
    }
        */

    try {
        ativarLoading();
        //console.log("ANTES DO LOGIN");
        const data = await apiLogin("/auth/login", {
            email,
            senha
        });
        //console.log("DEPOIS DO LOGIN");
        //console.log(data);
        if (data.status === 200) {
            console.log("ENTROU NO IF");
            window.location.href = "index.html";
        } else {
            throw new Error(data?.message || "Erro desconhecido");
        }
    } catch (err) {
        tratarErro(err);
    } finally {
        desativarLoading();
    }
});


// ============================================
// 🔄 REMOVE ERRO AO DIGITAR (UX)
// ============================================
emailInput.addEventListener("input", () => {
    emailInput.classList.remove("input-error");
});

senhaInput.addEventListener("input", () => {
    senhaInput.classList.remove("input-error");
});


// ============================================
// ✨ ANIMAÇÃO INPUT SENHA
// ============================================
senhaInput.addEventListener("input", () => {

    if (senhaInput.value.length > 0) {
        inputBox.classList.add("active");
    } else {
        inputBox.classList.remove("active");

        // 🔒 Reset visual da senha
        senhaInput.type = "password";
        toggleSenha.classList.add("bx-show");
        toggleSenha.classList.remove("bx-hide");
    }
});


// ============================================
// 👁️ TOGGLE VISUAL DA SENHA
// ============================================
toggleSenha.addEventListener("click", () => {

    const tipo = senhaInput.type === "password" ? "text" : "password";
    senhaInput.type = tipo;

    toggleSenha.classList.toggle("bx-show");
    toggleSenha.classList.toggle("bx-hide");
});


// ============================================
// 🔘 DESABILITA BOTÃO SE CAMPOS VAZIOS
// ============================================
form.addEventListener("input", () => {
    btn.disabled = !emailInput.value || !senhaInput.value;
});


// ============================
// 3. FUNÇÕES (REGRAS E LÓGICA)
// ============================

// ============================================
// 🧹 LIMPA ERROS VISUAIS
// ============================================
function limparErros() {
    erroGlobal.innerText = "";
    emailInput.classList.remove("input-error");
    senhaInput.classList.remove("input-error");
}


// ============================================
// ⚠️ VALIDAÇÃO DOS CAMPOS
// ============================================
function validarCampos(email, senha) {

    if (!email) {
        erroGlobal.innerText = "Informe o email.";
        emailInput.classList.add("input-error");
        return false;
    }

    if (!senha) {
        erroGlobal.innerText = "Informe a senha.";
        senhaInput.classList.add("input-error");
        return false;
    }

    return true;
}


// ============================================
// ⏳ ATIVA ESTADO DE LOADING
// ============================================
function ativarLoading() {
    btn.innerText = "Entrando...";
    btn.disabled = true;
}


// ============================================
// 🔄 DESATIVA ESTADO DE LOADING
// ============================================
function desativarLoading() {
    btn.innerText = "Entrar"; // Restaurar texto do botão para "Entrar"
    btn.disabled = false;
}


// ============================================
// ✅ SUCESSO NO LOGIN
// ============================================
function sucessoLogin() {
    // Não é mais necessário lidar com o token ou perfil aqui.
    // O backend já definiu os HttpOnly Cookies.
    // Apenas redireciona para a página principal.
    console.log("Redirecionando para index.html..."); // Adicionado log
    window.location.href = "index.html";
}

// ============================================
function tratarErro(err) {

    let mensagem = "Erro ao realizar login. Tente novamente.";

    if (err.message.includes("401")) {
        mensagem = "Email ou senha incorretos.";
    }
    else if (err.message.includes("Failed to fetch")) {
        mensagem = "Servidor indisponível. Verifique sua conexão.";
    }
    else if (err.message) {
        mensagem = err.message;
    }

    erroGlobal.innerText = mensagem;
}


