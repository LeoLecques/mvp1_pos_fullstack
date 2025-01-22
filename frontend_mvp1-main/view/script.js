document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const tabelaClientes = document.getElementById("clientes-tabela");

    // Função para carregar clientes e preencher a tabela
    async function carregarClientes() {
        try {
            const response = await fetch("http://localhost:5000/clientes", {
                method: "GET",
            });
            if (response.ok) {
                const data = await response.json();
                const clientesTratados = data.clientes.map(cliente => ({
                    ...cliente,
                    cpf: tratarCpf(cliente.cpf),
                    celular: tratarCelular(cliente.celular),
                    data_nascimento: tratarData(cliente.data_nascimento)
                }));
                preencherTabela(clientesTratados);
            } else {
                console.error("Erro ao carregar clientes:", response.status);
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
        }
    }

    // Função para preencher a tabela com os dados dos clientes
    function preencherTabela(clientes) {
        tabelaClientes.innerHTML = ""; // Limpa a tabela
        if (clientes.length === 0) {
            tabelaClientes.innerHTML = "<tr><td colspan='8' class='text-center'>Nenhum cliente encontrado.</td></tr>";
            return;
        }
        clientes.forEach((cliente) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.cpf}</td>
                <td>${cliente.email}</td>
                <td>${cliente.celular}</td>
                <td>${cliente.data_nascimento}</td>
                <td contenteditable="true">${cliente.margem || "N/A"}</td>
                <td>${cliente.data_insercao}</td>
                <td>
                    <button class="btn btn-danger btn-sm me-2" onclick="deletarCliente('${cliente.cpf}')">Deletar</button>
                    <button class="btn btn-primary btn-sm" onclick="atualizarCliente(this, '${cliente.cpf}')">Atualizar</button>

                </td>
            `;
            tabelaClientes.appendChild(row);
        });
    }

    // Função para deletar cliente
    async function deletarCliente(cpf) {
        if (!confirm("Tem certeza que deseja deletar este cliente?")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/cliente?cpf=${cpf}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("Cliente deletado com sucesso!");
                carregarClientes(); // Recarrega a tabela após deletar
            } else {
                alert("Erro ao deletar cliente.");
            }
        } catch (error) {
            console.error("Erro ao deletar cliente:", error);
            alert("Erro ao deletar cliente. Por favor, tente novamente.");
        }
    }

    // Função para tratar a data (dd/mm/aaaa -> aaaa-mm-dd)
    function tratarData(data) {
        const partes = data.split("/");
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
        }
        return data; // Retorna a data original se o formato for inválido
    }

    // Função para tratar o celular (remover caracteres especiais)
    function tratarCelular(celular) {
        return celular.replace(/[()\-\s]/g, ""); // Remove caracteres especiais do celular
    }

    // Função para tratar o CPF (remover caracteres especiais)
    function tratarCpf(cpf) {
        return cpf.replace(/[.\-\s]/g, ""); // Remove caracteres especiais do CPF
    }

    // Função para buscar um único cliente com base no CPF, celular ou e-mail
    async function buscarCliente() {
        const buscaInput = document.querySelector("input[placeholder='Pesquisar por CPF ou E-mail']").value.trim();

        if (!buscaInput) {
            alert("Por favor, insira CPF, celular ou e-mail para buscar!");
            return;
        }

        let parametro = "";
        if (buscaInput.includes("@")) {
            parametro = "email";
        } else if (/^\d{11}$/.test(buscaInput)) {
            parametro = "cpf";
        } else {
            parametro = "celular";
        }

        const valorFormatado = 
            parametro === "cpf" ? tratarCpf(buscaInput) :
            parametro === "celular" ? tratarCelular(buscaInput) :
            buscaInput;

        try {
            const response = await fetch(`http://localhost:5000/cliente?${parametro}=${valorFormatado}`, {
                method: "GET",
            });

            if (response.ok) {
                const cliente = await response.json();
                if (cliente) {
                    preencherTabela([cliente]); // Exibe apenas o cliente buscado
                } else {
                    alert("Cliente não encontrado.");
                    tabelaClientes.innerHTML = ""; // Limpa a tabela
                }
            } else {
                alert(`Erro ao buscar cliente: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro ao buscar cliente. Por favor, tente novamente.");
        }
    }

    // Torna as funções acessíveis globalmente
    window.buscarCliente = buscarCliente;
    window.deletarCliente = deletarCliente;

    // Adiciona evento de submit ao formulário
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const nome = form.querySelector("input[placeholder='Nome']").value.trim();
        const cpf = tratarCpf(form.querySelector("input[placeholder='CPF']").value.trim());
        const dataNascimento = tratarData(form
            .querySelector("input[placeholder='Data de Nascimento']")
            .value.trim());
        const celular = tratarCelular(form
            .querySelector("input[placeholder='Celular (DDD+Número)']")
            .value.trim());
        const email = form.querySelector("input[placeholder='E-mail']").value.trim();
        const margem = form
            .querySelector("input[placeholder='Margem Disponível (R$)']")
            .value.trim();

        if (!nome || !cpf || !dataNascimento || !celular || !email) {
            alert("Por favor, preencha todos os campos obrigatórios!");
            return;
        }

        const clienteData = {
            nome,
            cpf,
            data_nascimento: dataNascimento,
            celular,
            email,
            margem: margem ? parseFloat(margem) : null,
        };

        try {
            const response = await fetch("http://localhost:5000/cliente", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(clienteData),
            });

            if (response.ok) {
                alert("Cliente cadastrado com sucesso!");
                form.reset();
                carregarClientes();
            } else {
                const error = await response.json();
                alert(`Erro ao cadastrar cliente: ${error.error || "Erro desconhecido"}`);
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Ocorreu um erro ao enviar os dados. Por favor, tente novamente.");
        }
    });

        // Função para atualizar cliente
    async function atualizarCliente(button, cpf) {
        const row = button.closest("tr");
        const margemEditada = row.querySelector("td[contenteditable]").innerText.trim();

        if (!margemEditada || isNaN(margemEditada)) {
            alert("Por favor, insira um valor válido para a margem.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/cliente", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cpf: cpf,
                    margem: parseFloat(margemEditada),
                }),
            });

            if (response.ok) {
                alert("Cliente atualizado com sucesso!");
                carregarClientes(); // Recarrega a tabela após atualizar
            } else {
                alert("Erro ao atualizar cliente.");
            }
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            alert("Erro ao atualizar cliente. Por favor, tente novamente.");
        }
    }
    window.atualizarCliente  = atualizarCliente ;

    carregarClientes();
});
