from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public" / "files" / "cv-zh.pdf"

PAPER = colors.HexColor("#F7F8F5")
INK = colors.HexColor("#202522")
SOFT = colors.HexColor("#555D58")
MUTED = colors.HexColor("#7A827D")
LINE = colors.HexColor("#C9D0CA")
PINE = colors.HexColor("#284B44")
BRICK = colors.HexColor("#A84F3A")

pdfmetrics.registerFont(TTFont("MicrosoftYaHei", r"C:\Windows\Fonts\msyh.ttc"))
pdfmetrics.registerFont(TTFont("MicrosoftYaHeiBold", r"C:\Windows\Fonts\msyhbd.ttc"))
pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("ArialBold", r"C:\Windows\Fonts\arialbd.ttf"))


class PublicCV(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=18 * mm,
            bottomMargin=17 * mm,
            title="陈旺 - 学术简历",
            author="Wang Chen",
            subject="Academic CV",
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="body",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="main", frames=[frame], onPage=self._decorate))

    def _decorate(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.45)
        canvas.line(doc.leftMargin, 12 * mm, A4[0] - doc.rightMargin, 12 * mm)
        canvas.setFillColor(MUTED)
        canvas.setFont("Arial", 7.5)
        canvas.drawString(doc.leftMargin, 7.5 * mm, "Wang Chen · Academic CV · Updated August 2026")
        canvas.drawRightString(A4[0] - doc.rightMargin, 7.5 * mm, str(doc.page))
        canvas.restoreState()


styles = getSampleStyleSheet()
name_style = ParagraphStyle(
    "Name",
    parent=styles["Normal"],
    fontName="MicrosoftYaHeiBold",
    fontSize=23,
    leading=28,
    textColor=INK,
    spaceAfter=2,
)
latin_name_style = ParagraphStyle(
    "LatinName",
    parent=styles["Normal"],
    fontName="Arial",
    fontSize=10,
    leading=13,
    textColor=MUTED,
)
contact_style = ParagraphStyle(
    "Contact",
    parent=styles["Normal"],
    fontName="MicrosoftYaHei",
    fontSize=8.2,
    leading=13,
    textColor=PINE,
    alignment=TA_RIGHT,
)
lead_style = ParagraphStyle(
    "Lead",
    parent=styles["Normal"],
    fontName="MicrosoftYaHei",
    fontSize=9.3,
    leading=16,
    textColor=SOFT,
    spaceBefore=8,
    spaceAfter=8,
)
section_style = ParagraphStyle(
    "Section",
    parent=styles["Normal"],
    fontName="MicrosoftYaHeiBold",
    fontSize=12,
    leading=15,
    textColor=PINE,
    spaceBefore=10,
    spaceAfter=6,
)
body_style = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="MicrosoftYaHei",
    fontSize=8.7,
    leading=14,
    textColor=INK,
    spaceAfter=3,
)
body_soft_style = ParagraphStyle(
    "BodySoft",
    parent=body_style,
    textColor=SOFT,
)
date_style = ParagraphStyle(
    "Date",
    parent=styles["Normal"],
    fontName="MicrosoftYaHeiBold",
    fontSize=7.8,
    leading=12,
    textColor=BRICK,
)
item_title_style = ParagraphStyle(
    "ItemTitle",
    parent=styles["Normal"],
    fontName="MicrosoftYaHeiBold",
    fontSize=9,
    leading=14,
    textColor=INK,
    spaceAfter=1,
)
paper_style = ParagraphStyle(
    "Paper",
    parent=styles["Normal"],
    fontName="Arial",
    fontSize=8.25,
    leading=12.8,
    textColor=INK,
    spaceAfter=2,
)
paper_meta_style = ParagraphStyle(
    "PaperMeta",
    parent=body_style,
    fontSize=7.8,
    leading=12,
    textColor=MUTED,
    spaceAfter=5,
)
def section(title: str):
    return KeepTogether([
        Spacer(1, 2),
        Paragraph(title, section_style),
        HRFlowable(width="100%", thickness=0.55, color=LINE, spaceAfter=7),
    ])


def timeline(date: str, title: str, detail: str):
    return Table(
        [[Paragraph(date, date_style), Paragraph(title, item_title_style)], ["", Paragraph(detail, body_soft_style)]],
        colWidths=[30 * mm, 130 * mm],
        style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("SPAN", (0, 0), (0, 1)),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 1.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ]),
    )


def paper(number: int, title: str, authors: str, venue: str, links: str):
    return KeepTogether([
        Paragraph(f"{number}. <b>{title}</b>", paper_style),
        Paragraph(f"{authors}<br/><font color='#A84F3A'>{venue}</font> · {links}", paper_meta_style),
    ])


story = []

contact = (
    '<link href="mailto:cw501907@gmail.com" color="#284B44">cw501907@gmail.com</link><br/>'
    '<link href="https://scholar.google.com/citations?user=POf8d3UAAAAJ" color="#284B44">Google Scholar</link> · '
    '<link href="https://orcid.org/0009-0005-2574-5230" color="#284B44">ORCID</link><br/>'
    '<link href="https://mac.xmu.edu.cn/" color="#284B44">厦门大学 MAC 实验室</link> · Xiamen, China'
)
header = Table(
    [[Paragraph("陈旺", name_style), Paragraph(contact, contact_style)], [Paragraph("WANG CHEN", latin_name_style), ""]],
    colWidths=[65 * mm, 95 * mm],
    style=TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("SPAN", (1, 0), (1, 1)),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]),
)
story.extend([
    header,
    Spacer(1, 5),
    HRFlowable(width="100%", thickness=1.1, color=PINE, spaceAfter=4),
    Paragraph("厦门大学人工智能研究院与 MAC 实验室博士生。研究长视频理解、多模态推理与生成促进理解，关注模型怎样组织长时程视觉证据、生成可检查的候选解释，并回到原始观测中核验与修正。2026 年 5 月起在高德地图（阿里巴巴集团）实习，同年 9 月进入博士阶段。", lead_style),
])

story.append(section("研究方向"))
research_rows = [
    ["01", "长视频理解", "从查询相关性、语义边界和事件锚点出发，研究长视频中的帧选择与视觉 token 分配。"],
    ["02", "生成促进理解", "探索生成目标、内部特征与候选假设怎样帮助模型形成可核验的多模态理解。"],
    ["03", "流式视频理解", "面向持续到来的视频，研究分层记忆、事件更新和证据回看。"],
]
research_table = Table(
    [[Paragraph(i, date_style), Paragraph(t, item_title_style), Paragraph(d, body_soft_style)] for i, t, d in research_rows],
    colWidths=[13 * mm, 33 * mm, 114 * mm],
    style=TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -2), 0.35, LINE),
    ]),
)
story.append(research_table)

story.append(section("教育与经历"))
story.extend([
    timeline("2026.09 起", "厦门大学 · 人工智能 · 博士阶段", "MAC 实验室，导师为曹刘娟教授、郑侠武副教授。"),
    timeline("2026.05 至今", "高德地图 · 阿里巴巴集团 · 实习", "多模态与视频理解方向。"),
    timeline("2024.09 - 2026.08", "厦门大学 · 人工智能 · 硕博连读阶段", "长视频理解与多模态推理方向。GPA 3.76 / 4.0。"),
    timeline("2020.09 - 2024.06", "福州大学 · 人工智能 · 工学学士", "本科阶段开始研究生成式视觉与人脸美学。"),
])

story.append(section("论文"))
story.extend([
    paper(1, "Wavelet-based Frame Selection by Detecting Semantic Boundary for Long Video Understanding", "<b>Wang Chen</b>, Yuhui Zeng, Yongdong Luo, Tianyu Xie, Luojun Lin, Jiayi Ji, Yan Zhang, Xiawu Zheng", "CVPR 2026", '<link href="https://arxiv.org/abs/2603.00512" color="#284B44">Paper</link> · <link href="https://github.com/MAC-AutoML/WFS-SB" color="#284B44">Code</link>'),
    paper(2, "QuoTA: Query-oriented Token Assignment via CoT Query Decouple for Long Video Comprehension", "Yongdong Luo*, <b>Wang Chen*</b>, Weizhong Huang, Shukang Yin, Haojia Lin, Jinfa Huang, Chaoyou Fu, Jiayi Ji, Xiawu Zheng, Jiebo Luo", "AAAI 2026 · * Equal contribution", '<link href="https://doi.org/10.1609/aaai.v40i29.39595" color="#284B44">Paper</link> · <link href="https://github.com/MAC-AutoML/QuoTA" color="#284B44">Code</link>'),
    paper(3, "Event-Anchored Frame Selection for Effective Long-Video Understanding", "<b>Wang Chen*</b>, Yongdong Luo*, Yuhui Zeng, Luojun Lin, Tianyu Xie, Fei Chao, Rongrong Ji, Xiawu Zheng", "arXiv preprint · * Equal contribution", '<link href="https://arxiv.org/abs/2603.00983" color="#284B44">Paper</link>'),
    paper(4, "Customized Automatic Face Beautification", "<b>Wang Chen*</b>, Peizhen Chen*, Weijie Chen, Luojun Lin", "ICASSP 2023 · * Equal contribution", '<link href="https://doi.org/10.1109/ICASSP49357.2023.10096554" color="#284B44">Paper</link>'),
])

story.append(PageBreak())
story.append(section("论文（续）"))
story.extend([
    paper(5, "Real-Time Interactive Face Beautification", "Luojun Lin, <b>Wang Chen</b>, Peizhen Chen, Xiawu Zheng, Lianwen Jin", "SSRN preprint", '<link href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4923335" color="#284B44">Paper</link>'),
    paper(6, "Training-Free Multimodal Large Language Model Orchestration", "Tianyu Xie, Yuexiao Ma, Yuhang Wu, <b>Wang Chen</b>, Jiayi Ji, Tat-Seng Chua, Xiawu Zheng, Rongrong Ji", "ICML 2026", '<link href="https://arxiv.org/abs/2508.10016" color="#284B44">Paper</link>'),
    paper(7, "SocialOmni: Benchmarking Audio-Visual Social Interactivity in Omni Models", "Tianyu Xie, Jinfa Huang, Yuexiao Ma, Rongfang Luo, Yan Yang, <b>Wang Chen</b>, et al.", "arXiv preprint", '<link href="https://arxiv.org/abs/2603.16859" color="#284B44">Paper</link>'),
    paper(8, "WaveZip: Wavelet-Driven Space-Time Decoupling for Video Token Condensation", "Yuhui Zeng, <b>Wang Chen</b>, Jinfa Huang, Tianyu Xie, Yongdong Luo, Jiayi Ji, Xiawu Zheng, Jiebo Luo", "arXiv preprint", '<link href="https://arxiv.org/abs/2607.23265" color="#284B44">Paper</link>'),
    paper(9, "One Ranking, Any Budget: Matryoshka Evidence-to-Context Frame Selection for Long-Video Understanding", "<b>Wang Chen</b>, Yu Chen, Xiang Wang, Shuai Li, Jinfa Huang, Xiawu Zheng", "arXiv preprint", '<link href="https://arxiv.org/abs/2608.05707" color="#284B44">Paper</link>'),
])

story.append(section("进行中的研究"))
story.extend([
    timeline("A", "生成怎样帮助理解", "研究生成目标、内部生成特征与候选假设怎样暴露理解缺口，再由观测完成定位、核验和修正。"),
    timeline("B", "长时程流式视频理解", "研究持续视频中的分层记忆、事件更新与证据回看。"),
])

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
PublicCV(str(OUTPUT)).build(story)
print(OUTPUT)
