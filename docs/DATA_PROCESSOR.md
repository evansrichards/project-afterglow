# Data Processor - High-Level Orchestration

## Overview
The Data Processor orchestrates the complete journey from raw dating data upload to final report delivery. It manages a series of **Analyzers** (always run) and **Evaluators** (conditionally triggered) that progressively build insights.

## Processing Terminology

### **Analyzers** (Always Execute)
Core processing components that every user's data goes through:
- **Data Ingestion Analyzer**: File parsing, validation, normalization
- **Safety Screener**: Basic red flag detection and risk assessment
- **Pattern Recognizer**: Communication style and behavior identification
- **Chronology Mapper**: Time-based pattern analysis and growth tracking
- **Insight Synthesizer**: Combines all analysis into coherent user insights

### **Evaluators** (Conditionally Triggered)
Specialized deep-dive processors activated based on analysis findings:
- **Risk Evaluator**: Advanced safety assessment for concerning patterns
- **Attachment Evaluator**: Nuanced attachment style analysis for complex cases
- **Growth Evaluator**: Detailed personal development analysis for rich datasets
- **Crisis Evaluator**: Comprehensive safety planning for high-risk situations

## Processing Workflow

### Phase 1: Data Foundation
```
1. Data Ingestion Analyzer
   ├── Parse uploaded files (Tinder JSON, Hinge ZIP)
   ├── Validate data completeness and quality
   ├── Normalize to unified conversation schema
   └── ✅ Output: Clean conversation dataset

2. Safety Screener
   ├── Scan for immediate red flags (threats, financial requests)
   ├── Detect basic manipulation patterns
   ├── Assess overall risk level (green/yellow/orange/red)
   └── ✅ Output: Safety baseline + escalation flags
```

### Phase 2: Core Analysis
```
3. Pattern Recognizer
   ├── Analyze communication style and consistency
   ├── Identify attachment behavioral markers
   ├── Assess authenticity and vulnerability patterns
   ├── Evaluate boundary setting and respect
   └── ✅ Output: Core behavioral patterns

4. Chronology Mapper
   ├── Segment conversations by time periods
   ├── Weight recent patterns more heavily
   ├── Detect growth trajectories and transitions
   ├── Map life stage context and evolution
   └── ✅ Output: Time-weighted pattern evolution
```

### Phase 3: Conditional Deep Dives
```
5. Risk Evaluator (if Safety Screener flags concerns)
   ├── Advanced manipulation tactic detection
   ├── Coercive control pattern analysis
   ├── Trauma bonding indicator assessment
   └── ✅ Output: Detailed safety analysis + resources

6. Attachment Evaluator (if Pattern Recognizer finds complexity)
   ├── Sophisticated attachment style determination
   ├── Trigger and coping mechanism identification
   ├── Relationship dynamic analysis
   └── ✅ Output: Nuanced attachment insights

7. Growth Evaluator (if rich dataset or strong evolution detected)
   ├── Detailed skill progression tracking
   ├── Personal development opportunity identification
   ├── Customized growth recommendation generation
   └── ✅ Output: Personalized development roadmap

8. Crisis Evaluator (if high-risk indicators detected)
   ├── Comprehensive threat assessment
   ├── Professional resource identification
   ├── Safety planning and support system analysis
   └── ✅ Output: Crisis intervention recommendations
```

### Phase 4: Synthesis & Delivery
```
9. Insight Synthesizer
   ├── Combine all analyzer and evaluator outputs
   ├── Generate coherent narrative insights
   ├── Prioritize findings by importance and actionability
   ├── Create user-friendly report sections
   └── ✅ Output: Complete analysis report

10. Report Delivery System
    ├── Generate secure access token
    ├── Create analysis completion email
    ├── Send notification with report summary
    ├── Enable authenticated report dashboard access
    └── ✅ Output: User receives report access
```

## Trigger Conditions

### **Always Execute** (Core Pipeline)
- Data Ingestion Analyzer
- Safety Screener
- Pattern Recognizer
- Chronology Mapper
- Insight Synthesizer
- Report Delivery System

### **Conditional Execution** (Based on Findings)

#### Risk Evaluator Triggers:
- Safety Screener detects yellow/orange/red flags
- Pattern Recognizer identifies concerning behaviors
- Any manipulation or control indicators present

#### Attachment Evaluator Triggers:
- Pattern Recognizer finds mixed attachment signals
- Complex or contradictory behavioral patterns
- Rich conversational data warrants deeper analysis
- User shows significant relationship pattern variations

#### Growth Evaluator Triggers:
- Chronology Mapper detects significant evolution
- Dataset spans 2+ years with substantial growth evidence
- Strong positive development patterns identified
- User demonstrates advanced relationship skills

#### Crisis Evaluator Triggers:
- Risk Evaluator identifies severe safety concerns
- Escalating dangerous patterns detected
- Clear manipulation, coercion, or abuse indicators
- Immediate safety planning recommended

## Processing Status Tracking

### User-Visible Status Updates
```
📤 Upload Processing: "Analyzing your conversations..."
🔍 Safety Check: "Running safety assessment..."
🧠 Pattern Analysis: "Identifying communication patterns..."
📊 Timeline Mapping: "Analyzing growth over time..."
⚡ Deep Dive: "Running advanced analysis..." (if evaluators triggered)
✨ Finalizing: "Generating your insights..."
📧 Complete: "Analysis ready! Check your email."
```

### Processing Metadata Tracked
- Which analyzers completed successfully
- Which evaluators were triggered and why
- Processing duration for each component
- AI model usage and token consumption
- Quality confidence scores for each output
- Error handling and fallback usage

## Configuration Management

### Processing Rules (Configurable)
```yaml
# Processing thresholds can be adjusted
safety_escalation_threshold: "yellow"  # When to trigger Risk Evaluator
attachment_complexity_threshold: 0.3   # Mixed signal threshold for Attachment Evaluator
growth_dataset_minimum: "18_months"    # Minimum history for Growth Evaluator
crisis_risk_threshold: "orange"        # When to trigger Crisis Evaluator

# Resource limits
max_processing_time: "30_minutes"
fallback_mode_triggers: ["timeout", "api_error"]
budget_protection_enabled: true
```

This orchestration system provides clear visibility into the complex analysis process while maintaining flexibility for future enhancements and debugging.