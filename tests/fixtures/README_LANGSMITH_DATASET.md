# LangSmith Test Dataset

Dataset di test per Veronica Chatbot - 20 domande categorizzate per valutare il comportamento del chatbot.

## 📊 Contenuto Dataset

Il file `langsmith_test_dataset.jsonl` contiene **20 domande** in formato **JSON Lines** (un oggetto JSON per riga) suddivise in categorie:

### Categorie di test:

1. **Domande personali** (5 domande) - Dovrebbero usare `personal_summary` SENZA tool:
   - Cibo preferito
   - Stato civile
   - Passioni/hobby
   - Percorso professionale
   - Strumenti di organizzazione

2. **Domande tecniche con tool** (10 domande) - Dovrebbero chiamare tool specifici:
   - Certificazioni → `get_certifications()`
   - Ultimo articolo → `get_latest_blog_post()`
   - Libri → `get_books_and_reading()`
   - Stack tecnologico → `get_tools_and_stack()`
   - Ricerca contenuti → `search_all_content()`
   - Contatti → `get_contact_info()`
   - Progetti → `get_portfolio_projects()`
   - Esperienze → `get_work_experience()`
   - Ricerca blog → `search_blog_posts()`

3. **Domande fuori scope** (4 domande) - Dovrebbero essere RIFIUTATE:
   - Tutorial WordPress
   - Teoria ML generica
   - Ricette
   - Tutorial Python

## 🚀 Come caricare su LangSmith

### Opzione 1: Upload da UI (Consigliato)

1. Vai su [LangSmith](https://smith.langchain.com/)
2. Naviga su **Datasets** nel menu laterale
3. Clicca **"+ New Dataset"**
4. Seleziona **"Upload from file"**
5. Carica il file `langsmith_test_dataset.jsonl`
6. Nome suggerito: `veronica-chatbot-test-questions`
7. Descrizione: "Test questions per Veronica Chatbot - valuta uso corretto di tool e personal_summary"

### Opzione 2: Upload via API

```python
from langsmith import Client
import json

client = Client()

# Leggi dataset JSONL (JSON Lines)
data = []
with open("tests/fixtures/langsmith_test_dataset.jsonl") as f:
    for line in f:
        data.append(json.loads(line))

# Crea dataset
dataset = client.create_dataset(
    dataset_name="veronica-chatbot-test-questions",
    description="Test questions per Veronica Chatbot"
)

# Carica esempi
for item in data:
    client.create_example(
        inputs={"question": item["inputs_1"]},
        outputs={"expected": item["outputs_1"]},
        dataset_id=dataset.id
    )
```

## 🧪 Come testare il chatbot

### 1. Test manuale su LangGraph Studio

1. Apri LangGraph Studio
2. Carica il progetto `veronica-chatbot-v2`
3. Per ogni domanda del dataset, verifica:
   - ✅ Risposta corretta?
   - ✅ Tool chiamato correttamente (o nessun tool se dovrebbe usare summary)?
   - ✅ Risposta contiene informazioni accurate?

### 2. Evaluation automatica su LangSmith

1. Vai su LangSmith → **Datasets** → `veronica-chatbot-test-questions`
2. Clicca **"Run Evaluation"**
3. Seleziona:
   - **Target**: Il tuo deployed chatbot o endpoint locale
   - **Evaluators**: Aggiungi evaluator custom o usa quelli predefiniti
4. Clicca **"Start Evaluation"**
5. Aspetta i risultati e analizza:
   - Accuracy
   - Latency
   - Tool usage corretto
   - Output quality

## 📈 Metriche da monitorare durante interview

Quando mostri il dataset durante l'interview, evidenzia:

1. **Coverage completo**:
   - ✅ Domande personali (summary)
   - ✅ Domande tecniche (tools)
   - ✅ Edge cases (rifiuti)

2. **Comportamento atteso chiaro**:
   - Ogni domanda ha `outputs_1` che spiega cosa dovrebbe fare il chatbot
   - Facile validare se il comportamento è corretto

3. **Testing sistematico**:
   - Non serve testare manualmente ogni volta
   - Evaluation automatica su LangSmith
   - Tracciabilità risultati nel tempo

## 🧪 Strategia di Evaluation Completa

Attualmente il dataset è configurato con un evaluator **Correctness** base. Per una valutazione production-ready completa, il piano è implementare evaluator aggiuntivi per coprire tutte le dimensioni di qualità:

### 📊 Evaluator implementati (v1.0)

- ✅ **Correctness**: Verifica accuratezza fattuale e completezza rispetto al reference output

### 🚀 Roadmap Evaluator (future iterations)

#### **Qualità del contenuto**
- [ ] **Relevance** (Rilevanza): La risposta è pertinente alla domanda?
- [ ] **Completeness** (Completezza): Tutti gli aspetti della domanda sono coperti?
- [ ] **Factuality/Hallucinations** (Fattualità): Ci sono informazioni inventate o allucinazioni?
- [ ] **Coherence** (Coerenza): La risposta è logicamente coerente e ben strutturata?

#### **Qualità comunicativa**
- [ ] **Fluency** (Fluidità): Il testo è naturale e grammaticalmente corretto?
- [ ] **Style Consistency** (Consistenza stilistica): Mantiene il tono professionale ma coinvolgente?
- [ ] **Conciseness** (Concisione): Evita verbosità inutile?

#### **Comportamento del sistema**
- [ ] **Tool Usage Accuracy** (Uso corretto dei tool): Chiama i tool giusti al momento giusto?
- [ ] **Scope Adherence** (Aderenza allo scope): Rifiuta correttamente domande out-of-scope?
- [ ] **Context & Memory** (Contesto e memoria): Mantiene contesto in conversazioni multi-turn?
- [ ] **Error Recovery** (Recupero errori): Gestisce gracefully errori di tool/API?

#### **Qualità tecnica**
- [ ] **Latency** (Latenza): Tempo di risposta < 3s per 95% delle query?
- [ ] **Robustness** (Robustezza): Gestisce typo, ambiguità, input malformati?
- [ ] **Bias Detection** (Rilevamento bias): Evita bias di genere, etnia, etc.?
- [ ] **Safety/Toxicity** (Sicurezza/Tossicità): Non genera contenuti offensivi?

### 🎯 Prioritizzazione per production

**Phase 1 (MVP - Attuale)**:
- Correctness

**Phase 2 (Pre-production)**:
- Tool Usage Accuracy
- Scope Adherence
- Factuality/Hallucinations
- Latency

**Phase 3 (Production monitoring)**:
- Relevance
- Completeness
- Context & Memory
- Error Recovery

**Phase 4 (Advanced quality)**:
- Coherence, Fluency, Style Consistency
- Robustness, Bias Detection
- Safety/Toxicity

### 📝 Esempio: Custom Evaluator "Tool Usage Accuracy"

```python
# Prompt per evaluator custom
"""
You are evaluating if the chatbot used the correct tool for answering the question.

<input>
{{input.messages}}
</input>

<expected_tool>
{{reference.expected_tool}}
</expected_tool>

<actual_output>
{{output}}
</actual_output>

<tool_calls>
{{output.tool_calls}}  # LangSmith auto-popola questo campo
</tool_calls>

Return TRUE if:
- The expected_tool was called
- OR no tool was needed and none was called (for personal questions)

Return FALSE if:
- Wrong tool was called
- Expected tool was NOT called
- Tool was called when it shouldn't have been
"""

# Criteri: Binary score (TRUE/FALSE)
# TRUE = Tool usage corretto
# FALSE = Tool usage errato
```

### 💡 Benefici approccio multi-evaluator

1. **Coverage completa**: Ogni dimensione di qualità è testata
2. **Debugging targeted**: Se "Correctness" passa ma "Tool Usage" fallisce → sappiamo dove guardare
3. **Metriche dashboard**: Tracking nel tempo per ogni metrica
4. **A/B testing**: Confronto tra versioni prompt/model su tutte le dimensioni
5. **Production monitoring**: Alert se metriche degradano

### 📈 Metriche aggregate ideali per production

| Metrica | Target | Criticità |
|---------|--------|-----------|
| **Correctness** | >95% | 🔴 Critical |
| **Tool Usage Accuracy** | >98% | 🔴 Critical |
| **Scope Adherence** | >99% | 🔴 Critical |
| **Factuality** | >98% | 🔴 Critical |
| **Latency p95** | <3s | 🟡 Important |
| **Relevance** | >90% | 🟡 Important |
| **Completeness** | >85% | 🟢 Nice-to-have |
| **Context retention** | >80% | 🟢 Nice-to-have |

---

## 💡 Estensione dataset futura

Idee per espandere la copertura del dataset:

- [ ] **Domande multi-step**: "Quali progetti hai fatto con LangChain e quali certificazioni hai su questo tema?"
- [ ] **Domande ambigue**: "Parlami del tuo background" (tecnico? personale? entrambi?)
- [ ] **Multilingua**: Domande in inglese per testare robustezza
- [ ] **Typo/errori**: "Qualie certifiazioni ahi?" → deve comunque capire
- [ ] **Conversazioni multi-turn**: Context awareness su 3-5 messaggi
- [ ] **Edge cases negativi**: Input vuoti, troppo lunghi, caratteri speciali
- [ ] **Adversarial testing**: Prompt injection attempts, jailbreak tentativi

## 🔗 Link utili

- [LangSmith Datasets Documentation](https://docs.smith.langchain.com/concepts/datasets)
- [LangSmith Evaluation Guide](https://docs.smith.langchain.com/concepts/evaluation)
- [LangGraph Studio](https://github.com/langchain-ai/langgraph-studio)
