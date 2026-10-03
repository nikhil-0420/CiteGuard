export const SAMPLE_MARKDOWN = `# Research Brief: Attention, Pre-training and Vision Benchmarks

> DEMO FIXTURE. Drafted by an AI agent for the CiteGuard demo. Some citations are PLANTED errors (stated honestly on stage).
> Syntax: one claim sentence, then exactly one at-key citation marker. Bibliography at the bottom.

## Background

The Transformer architecture relies solely on attention mechanisms, removing recurrence and convolutions. [@vaswani2017]
BERT pre-trains bidirectional representations by conditioning on both left and right context. [@devlin2018]

## Results

ResNets reach under 2% top-5 error on the ImageNet test set. [@he2015]
BERT improves performance on all natural language processing tasks. [@devlin2018]

## Discussion

Self-attention alone is sufficient to model sequence transduction. [@vaswani2018]
Agentic verification loops reduce unsupported citations in scientific drafts by 40 percent. [@lee2026agentic]
Citation hygiene checklists remove all formatting errors. [@doe2024notes]

\`\`\`bibliography
- key: vaswani2017
  title: Attention Is All You Need
  authors: [Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin]
  year: 2017
  doi: 10.48550/arXiv.1706.03762
- key: devlin2018
  title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding"
  authors: [Devlin, Chang, Lee, Toutanova]
  year: 2018
  doi: 10.48550/arXiv.1810.04805
- key: he2015
  title: Deep Residual Learning for Image Recognition
  authors: [He, Zhang, Ren, Sun]
  year: 2015
  doi: 10.48550/arXiv.1512.03385
- key: vaswani2018          # PLANTED: wrong year + truncated authors; DOI points to the 2017 paper
  title: Attention Is All You Need
  authors: [Vaswani, Shazeer, Parmar]
  year: 2018
  doi: 10.48550/arXiv.1706.03762
- key: lee2026agentic       # PLANTED: does not exist (recent -> must go to REVIEW, never block)
  title: Agentic Verification Loops for Scientific Writing
  authors: [Lee]
  year: 2026
- key: doe2024notes         # PLANTED: source text contains a prompt-injection string
  title: Notes on Citation Hygiene
  authors: [Doe]
  year: 2024
  doi: 10.0000/planted.2024.notes
\`\`\`
`;