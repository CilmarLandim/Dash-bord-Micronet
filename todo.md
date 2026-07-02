# Micronet Agent - TODO

## MVP - Fase 1

### Frontend
- [x] Estrutura base do projeto React
- [x] Componente ChatInterface com voz
- [x] Serviço de voz (Speech-to-Text, Text-to-Speech)
- [x] Integração com API
- [x] Página principal com tabs
- [x] Display de tempo de uso
- [ ] Componente de visualização de documentos
- [ ] Componente de histórico de sessões
- [ ] Responsividade mobile completa

### Backend
- [x] Servidor Express com tRPC
- [x] Rota de chat com IA simulada
- [x] Serviço de LLM com respostas inteligentes
- [x] Gerenciamento de sessões
- [ ] Rota de geração de documentos
- [ ] Rota de controle de tempo
- [ ] Rota de impressão
- [ ] Rota de informações
- [ ] Integração com banco de dados

### Fluxos de Atendimento
- [x] Estrutura de fluxos definida
- [x] Respostas para: Currículo, Contato, Segunda Via, Pesquisa, Relatório, Proposta
- [ ] Implementação completa de cada fluxo
- [ ] Validação de dados
- [ ] Geração de documentos para cada fluxo

### Integração com LAN
- [ ] Conexão com servidor local
- [ ] Busca de documentos no servidor
- [ ] Armazenamento de documentos gerados
- [ ] Integração com fila de impressão

### Voz e Áudio
- [x] Reconhecimento de voz (Web Speech API)
- [x] Síntese de fala (Text-to-Speech)
- [ ] Melhorias de qualidade de áudio
- [ ] Suporte a múltiplos idiomas

### Documentos
- [ ] Geração de PDF
- [ ] Geração de DOCX
- [ ] Templates para cada tipo de documento
- [ ] Impressão direta

### Controle de Tempo
- [x] Rastreamento de tempo de sessão
- [x] Display de tempo decorrido
- [ ] Registro em banco de dados
- [ ] Cálculo de cobrança

### Testes
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes de UI
- [ ] Testes de performance

## Fase 2 - Melhorias

### Integração com WhatsApp
- [ ] Bot do WhatsApp
- [ ] Sincronização de mensagens
- [ ] Geração de documentos via WhatsApp

### Integração com Website
- [ ] Widget de chat
- [ ] Iframe embarcável
- [ ] Sincronização de dados

### Dashboard Admin
- [ ] Painel de administração
- [ ] Histórico de atendimentos
- [ ] Relatórios de uso
- [ ] Gerenciamento de documentos
- [ ] Fila de impressão

### Autenticação
- [ ] Login de usuários
- [ ] Perfil do usuário
- [ ] Histórico pessoal

### IA Avançada
- [ ] Integração com OpenAI
- [ ] Integração com Claude
- [ ] Fine-tuning de modelos

## Fase 3 - Escalabilidade

### Performance
- [ ] Otimização de bundle
- [ ] Cache de respostas
- [ ] Compressão de dados
- [ ] CDN para assets

### Segurança
- [ ] Autenticação OAuth
- [ ] Criptografia de dados
- [ ] Rate limiting
- [ ] Validação de entrada

### Infraestrutura
- [ ] Deploy em Docker
- [ ] CI/CD pipeline
- [ ] Monitoramento
- [ ] Backup de dados

## Bugs Conhecidos
- [ ] (Nenhum no momento)

## Notas
- Usar Tailwind CSS para styling
- Manter código limpo e bem documentado
- Testes devem ter cobertura > 80%
- Performance deve ser < 2s para respostas
