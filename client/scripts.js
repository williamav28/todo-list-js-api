// A URL base para a API do servidor, conforme o repositório base [cite: 17]
const API_BASE_URL = "http://127.0.0.1:8000";

// --- FUNÇÕES DE AUTENTICAÇÃO ---

// Cadastro [cite: 11, 23]
const postUser = async () => {
  let user = document.getElementById("user").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let msgElement = document.getElementById("signupMsg");

  if (!user || !email || !password) {
    msgElement.innerText = "Erro: Preencha todos os campos.";
    msgElement.style.color = "red";
    return;
  }

  let payload = { name: user, email: email, password: password };
  let url = `${API_BASE_URL}/auth/signup`;

  fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  })
    .then(r => {
      if (!r.ok) throw new Error("Erro ao cadastrar usuário. O email já pode estar em uso.");
      return r.json();
    })
    .then(() => {
      msgElement.innerText = "✅ Cadastro realizado com sucesso! Faça o login.";
      msgElement.style.color = "green";
      // Limpar campos
      document.getElementById("user").value = "";
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    })
    .catch(err => {
      msgElement.innerText = "❌ Erro: " + err.message;
      msgElement.style.color = "red";
    });
};

// Login [cite: 10, 24]
const loginUser = async () => {
  let email = document.getElementById("loginEmail").value;
  let password = document.getElementById("loginPassword").value;
  let msgElement = document.getElementById("loginMsg");

  if (!email || !password) {
    msgElement.innerText = "Erro: Preencha o email e a senha.";
    msgElement.style.color = "red";
    return;
  }

  let payload = { email, password };
  let url = `${API_BASE_URL}/auth/login`;

  fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  })
    .then(r => {
      if (!r.ok) throw new Error("Credenciais inválidas. Tente novamente.");
      return r.json();
    })
    .then(data => {
      localStorage.setItem("token", data.access_token);
      msgElement.innerText = "✅ Login realizado com sucesso!";
      msgElement.style.color = "green";

      // Exibir seção de tarefas e carregar lista
      document.getElementById("tasksSection").style.display = "block";
      listTasks();
    })
    .catch(err => {
      msgElement.innerText = "❌ Erro: " + err.message;
      msgElement.style.color = "red";
    });
};

// Logout
const logoutUser = () => {
  localStorage.removeItem("token");
  document.getElementById("tasksSection").style.display = "none";
  document.getElementById("loginMsg").innerText = "Logout realizado!";
  document.getElementById("loginMsg").style.color = "green";
};

// --- FUNÇÕES DE TAREFAS (CRUD) ---

// Função auxiliar para obter o token
const getToken = () => localStorage.getItem("token");

// Criar tarefa [cite: 12, 25]
const createTask = async () => {
  let title = document.getElementById("newTaskTitle").value.trim();
  let token = getToken();
  let msgElement = document.getElementById("tasksMsg");

  if (!token) {
    msgElement.innerText = "Erro: Usuário não logado.";
    msgElement.style.color = "red";
    return;
  }

  if (!title) {
    msgElement.innerText = "Erro: O título da tarefa não pode ser vazio.";
    msgElement.style.color = "red";
    return;
  }

  fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title, done: false }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
  })
    .then(r => {
      if (!r.ok) throw new Error("Erro ao criar tarefa. Tente novamente.");
      return r.json();
    })
    .then(task => {
      msgElement.innerText = "✅ Tarefa criada!";
      msgElement.style.color = "green";
      document.getElementById("newTaskTitle").value = "";
      renderTask(task); // Adiciona a nova tarefa diretamente na lista
    })
    .catch(err => {
      msgElement.innerText = "❌ Erro: " + err.message;
      msgElement.style.color = "red";
    });
};

// Listar tarefas [cite: 12, 25]
const listTasks = async () => {
  let token = getToken();
  let msgElement = document.getElementById("tasksMsg");

  if (!token) {
    msgElement.innerText = "Erro: Usuário não logado.";
    msgElement.style.color = "red";
    return;
  }

  fetch(`${API_BASE_URL}/tasks`, {
    method: "GET",
    headers: { "Authorization": "Bearer " + token },
  })
    .then(r => {
      if (!r.ok) throw new Error("Erro ao listar tarefas.");
      return r.json();
    })
    .then(data => {
      // O servidor pode retornar {tasks: []} ou diretamente []
      let tasks = data.tasks ?? data;
      let ul = document.getElementById("tasksList");
      ul.innerHTML = ""; // Limpa a lista existente
      if (tasks.length === 0) {
          msgElement.innerText = "Nenhuma tarefa encontrada. Crie a primeira!";
          msgElement.style.color = "blue";
      } else {
          msgElement.innerText = "";
          tasks.forEach(renderTask);
      }
    })
    .catch(err => {
      msgElement.innerText = "❌ Erro ao carregar tarefas: " + err.message;
      msgElement.style.color = "red";
    });
};

// Renderizar tarefa (Cria o elemento visual LI)
const renderTask = (task) => {
  let ul = document.getElementById("tasksList");

  // Cria o elemento principal da lista
  let li = document.createElement("li");
  li.id = `task-${task.id}`; // Adiciona um ID para fácil manipulação

  // Contêiner esquerdo (Checkbox + Título)
  let left = document.createElement("div");
  left.classList.add("task-left");

  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.title = task.done ? "Marcar como pendente" : "Marcar como concluída";
  // O nome da função está correto, não é necessário o 'async' aqui
  checkbox.onchange = () => toggleTask(task.id, checkbox.checked); 

  let span = document.createElement("span");
  span.innerText = task.title;

  left.appendChild(checkbox);
  left.appendChild(span);

  // Botões de Ação
  let editBtn = document.createElement("button");
  editBtn.innerText = "Editar";
  editBtn.classList.add("task-btn");
  editBtn.onclick = () => editTask(task.id, span);

  let delBtn = document.createElement("button");
  delBtn.innerText = "Excluir";
  delBtn.classList.add("task-btn");
  delBtn.onclick = () => deleteTask(task.id, li);

  // Monta o LI
  li.appendChild(left);
  li.appendChild(editBtn);
  li.appendChild(delBtn);

  // Adiciona o LI à lista
  ul.appendChild(li);
};

// Atualizar status (Toggle: Concluída/Pendente) [cite: 12, 25]
const toggleTask = async (id, done) => {
  let token = getToken();

  fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify({ done }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
  })
  // Não é necessário processar o JSON, apenas garantir que a requisição ocorreu
  .catch(err => console.error("Erro ao atualizar status:", err));
};

// Editar tarefa [cite: 12, 25]
const editTask = async (id, span) => {
  let novoTitulo = prompt("Novo título:", span.innerText);
  if (!novoTitulo || novoTitulo.trim() === span.innerText.trim()) return;

  let token = getToken();
  let tituloTratado = novoTitulo.trim();

  fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title: tituloTratado }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
  })
    .then(r => {
        if (!r.ok) throw new Error("Falha ao editar tarefa.");
        return r.json();
    })
    .then(t => (span.innerText = t.title))
    .catch(err => {
        document.getElementById("tasksMsg").innerText = "❌ Erro ao editar: " + err.message;
        document.getElementById("tasksMsg").style.color = "red";
    });
};

// Excluir tarefa [cite: 12, 25]
const deleteTask = async (id, li) => {
  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

  let token = getToken();

  fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token },
  })
    .then(r => {
        if (!r.ok) throw new Error("Falha ao excluir tarefa.");
        li.remove();
        document.getElementById("tasksMsg").innerText = "✅ Tarefa excluída!";
        document.getElementById("tasksMsg").style.color = "green";
    })
    .catch(err => {
        document.getElementById("tasksMsg").innerText = "❌ Erro ao excluir: " + err.message;
        document.getElementById("tasksMsg").style.color = "red";
    });
};