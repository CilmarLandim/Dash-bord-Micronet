# Micronet Agent - Estrutura do Projeto

## 📁 Arquitetura

```
micronet-agent/
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx        # Interface principal do chat
│   │   ├── VoiceInput.tsx           # Entrada de voz (microfone)
│   │   ├── DocumentPreview.tsx      # Visualização de documentos
│   │   ├── TimerDisplay.tsx         # Exibição de tempo de uso
│   │   └── MicronetInfo.tsx         # Informações sobre Micronet
│   ├── pages/
│   │   ├── Home.tsx                 # Página inicial
│   │   ├── Chat.tsx                 # Página de chat
│   │   └── Admin.tsx                # Painel administrativo
│   ├── services/
│   │   ├── api.ts                   # Chamadas à API
│   │   ├── speechToText.ts          # Conversão de voz para texto
│   │   ├── textToSpeech.ts          # Conversão de texto para voz
│   │   └── documentGenerator.ts     # Geração de documentos
│   ├── types/
│   │   └── index.ts                 # Tipos TypeScript
│   ├── styles/
│   │   └── globals.css              # Estilos globais
│   ├── App.tsx                      # Componente raiz
│   └── main.tsx                     # Entrada da aplicação
├── server/
│   ├── routers/
│   │   ├── chat.ts                  # Rotas de chat
│   │   ├── documents.ts             # Rotas de documentos
│   │   ├── time.ts                  # Rotas de controle de tempo
│   │   └── info.ts                  # Rotas de informações
│   ├── services/
│   │   ├── llm.ts                   # Integração com LLM
│   │   ├── documentService.ts       # Serviço de geração de documentos
│   │   ├── lanService.ts            # Integração com servidor LAN
│   │   └── printService.ts          # Serviço de impressão
│   ├── db/
│   │   ├── schema.ts                # Schema do banco de dados
│   │   └── queries.ts               # Queries do banco
│   ├── index.ts                     # Servidor Express
│   └── trpc.ts                      # Configuração tRPC
├── public/
│   └── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🎯 Fluxos de Atendimento

### 1. **Currículo**
   - Pergunta: Nome completo
   - Pergunta: Experiência profissional
   - Pergunta: Formação acadêmica
   - Pergunta: Habilidades
   - Gera: Documento PDF/DOCX
   - Ação: Salva no servidor + Imprime

### 2. **Contato**
   - Pergunta: Nome
   - Pergunta: Email
   - Pergunta: Telefone
   - Pergunta: Assunto
   - Pergunta: Mensagem
   - Ação: Envia para equipe + Salva

### 3. **Segunda Via**
   - Pergunta: Tipo de documento (RG, CPF, etc)
   - Pergunta: Dados para busca
   - Busca: No servidor local
   - Gera: Documento
   - Ação: Imprime

### 4. **Pesquisa Escolar**
   - Pergunta: Tema
   - Pergunta: Série/Nível
   - Pergunta: Quantidade de páginas
   - Gera: Documento com pesquisa
   - Ação: Salva + Imprime

### 5. **Relatório**
   - Pergunta: Tipo de relatório
   - Pergunta: Período
   - Pergunta: Dados específicos
   - Gera: Relatório formatado
   - Ação: Salva + Imprime

### 6. **Proposta**
   - Pergunta: Tipo de proposta
   - Pergunta: Detalhes
   - Pergunta: Valores
   - Gera: Proposta comercial
   - Ação: Salva + Imprime

## 💾 Armazenamento

- **Local**: Servidor LAN (pasta compartilhada)
- **Formato**: PDF + DOCX
- **Estrutura**: `/documentos/{tipo}/{data}/{id}.pdf`

## ⏱️ Controle de Tempo

- Inicia quando usuário começa o chat
- Pausa quando sai do chat
- Registra em banco local
- Usado para cobrança

## 🔊 Integração de Voz

- **Entrada**: Web Speech API (microfone)
- **Saída**: Text-to-Speech (fone)
- **Processamento**: Whisper API (opcional)

## 🌐 Canais Futuros

- WhatsApp Bot
- Website Widget
- App Mobile

## 📊 Dashboard Admin

- Histórico de atendimentos
- Tempo total por usuário
- Documentos gerados
- Fila de impressão
- Relatórios de uso
