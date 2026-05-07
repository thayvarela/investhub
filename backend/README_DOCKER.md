# Guia Rápido: Docker e Banco de Dados

## 1. Preciso estar com o Docker rodando?
**Sim.** O banco de dados da aplicação vive dentro de um container Docker. Se o Docker não estiver rodando, o backend não conseguirá conectar ao banco e você verá erros de login.

## 2. Como meus dados são salvos?
Seus dados são salvos em um "Volume" do Docker chamado `postgres_data`.
- **O que isso significa?** Mesmo que você desligue o container (`docker-compose stop`), os dados permanecem seguros nesse volume.
- **Quando eu perco dados?** Você só perde dados se rodar um comando que apague explicitamente os volumes, como `docker-compose down -v` (o `-v` significa *volumes*).

## 3. Comandos Seguros (Não apagam dados)

### Iniciar o banco (e deixar rodando em segundo plano)
```bash
docker-compose up -d
```

### Parar o banco (apenas desliga, mantém dados)
```bash
docker-compose stop
```

### Reiniciar o banco
```bash
docker-compose restart
```

## 4. Comandos Perigosos (CUIDADO ⚠️)

### Apagar tudo (Containers + DADOS)
```bash
docker-compose down -v
```
*Evite usar `-v` a menos que queira resetar o banco do zero.*

## 5. Soluções Comuns

### "Falha no login" após reiniciar o PC
1. Verifique se o Docker Desktop está aberto.
2. Abra o terminal na pasta `backend` e rode:
   ```bash
   docker-compose up -d
   ```
3. Aguarde alguns segundos e tente logar novamente.
