from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


BASE = Path(__file__).parent
OUT = BASE / "New_Employee_Enrollment_UI_Recommendation_Packet.docx"
ASSETS = BASE / "recommendation-graphics"
INK = "183143"
SKY = "DDF3F4"
MIST = "F5FAF9"
GREEN = "32B875"
CORAL = "F28C72"
SUN = "F6C85F"
LINE = "C9D8DC"
WHITE = "FFFFFF"
GRAY = "5B6B73"


def font(size, bold=False):
    names = ["/Library/Fonts/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"] if bold else ["/Library/Fonts/Arial.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"]
    for name in names:
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def c(value):
    return "#" + value if len(value) == 6 else value


def rr(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=c(fill), outline=c(outline) if outline else None, width=width)


def text(draw, xy, value, size=24, bold=False, fill=INK):
    draw.text(xy, value, font=font(size, bold), fill=c(fill))


def spaceship(draw, x, y, scale=1):
    """Small alien spaceship guide with two green blinking-light marks."""
    draw.ellipse((x - 40 * scale, y - 28 * scale, x + 40 * scale, y + 28 * scale), fill="#F8F4E9", outline=c(INK), width=max(1, int(2 * scale)))
    draw.ellipse((x - 24 * scale, y - 16 * scale, x + 24 * scale, y + 14 * scale), fill=c(INK))
    draw.ellipse((x - 12 * scale, y - 8 * scale, x - 3 * scale, y + 1 * scale), fill=c(SKY))
    draw.ellipse((x + 12 * scale, y - 9 * scale, x + 19 * scale, y - 2 * scale), fill=c(GREEN))
    draw.ellipse((x + 12 * scale, y + 3 * scale, x + 19 * scale, y + 10 * scale), fill=c(GREEN))
    draw.line((x - 45 * scale, y + 15 * scale, x - 65 * scale, y + 32 * scale), fill=c(CORAL), width=max(2, int(3 * scale)))
    draw.line((x + 45 * scale, y + 15 * scale, x + 65 * scale, y + 32 * scale), fill=c(CORAL), width=max(2, int(3 * scale)))


def callout(draw, n, x, y, label, line_to):
    draw.ellipse((x, y, x + 35, y + 35), fill=c(CORAL))
    text(draw, (x + 11, y + 5), str(n), 19, True, WHITE)
    text(draw, (x + 46, y + 6), label, 18, True, INK)
    draw.line((x + 17, y + 35, line_to[0], line_to[1]), fill=c(CORAL), width=3)


def shell(draw, label):
    rr(draw, (18, 18, 1382, 722), 24, WHITE, LINE, 3)
    rr(draw, (18, 18, 1382, 102), 24, SKY)
    draw.rectangle((18, 74, 1382, 102), fill=c(SKY))
    spaceship(draw, 70, 58, 0.53)
    text(draw, (120, 39), "New Employee Enrollment", 27, True)
    text(draw, (1115, 46), label, 18, False, GRAY)


def employee_future(path):
    image = Image.new("RGB", (1400, 740), c(MIST))
    draw = ImageDraw.Draw(image)
    shell(draw, "Employee self service")
    text(draw, (60, 130), "Choose medical coverage", 32, True)
    text(draw, (60, 174), "Step 2 of 5  •  Medical coverage", 20, False, GRAY)
    draw.line((65, 218, 675, 218), fill="#A9DCC5", width=5)
    for index, x in enumerate([65, 218, 370, 522, 675]):
        draw.ellipse((x - 10, 208, x + 10, 228), fill=c(GREEN) if index < 2 else c(WHITE), outline=c(GREEN), width=3)
    rr(draw, (60, 255, 725, 342), 18, SKY)
    text(draw, (85, 275), "I can help with benefit choices, dependents, costs, and confirmation.", 18, True)
    text(draw, (85, 305), "For other questions, I will point you to the right team.", 17, False, GRAY)
    rr(draw, (60, 370, 380, 558), 18, WHITE, LINE, 2)
    text(draw, (86, 396), "Value PPO", 23, True)
    text(draw, (86, 432), "$84 per pay period", 20, False, GRAY)
    text(draw, (86, 471), "Lower premium", 17, False, GRAY)
    rr(draw, (86, 503, 248, 542), 15, INK)
    text(draw, (111, 513), "View comparison", 15, True, WHITE)
    rr(draw, (402, 370, 725, 558), 18, WHITE, GREEN, 3)
    text(draw, (428, 396), "Choice PPO", 23, True)
    text(draw, (428, 432), "$122 per pay period", 20, False, GRAY)
    text(draw, (428, 471), "More predictable costs", 17, False, GRAY)
    rr(draw, (428, 503, 575, 542), 15, GREEN)
    text(draw, (469, 513), "Select plan", 15, True, WHITE)
    rr(draw, (770, 130, 1338, 615), 22, INK)
    text(draw, (805, 164), "YOUR ENROLLMENT", 17, True, SKY)
    for y, title, value in [(225, "Medical", "Choice PPO"), (306, "Dental", "Not selected"), (387, "Covered dependents", "Jordan + Riley")]:
        rr(draw, (805, y, 1305, y + 60), 12, "24485C")
        text(draw, (830, y + 15), title, 17, True, WHITE)
        text(draw, (1082, y + 16), value, 16, False, SKY)
    text(draw, (805, 495), "Estimated payroll deduction", 18, False, SKY)
    text(draw, (805, 527), "$122.00 / pay period", 28, True, WHITE)
    text(draw, (805, 568), "Review before submitting", 16, True, "A9DCC5")
    callout(draw, 1, 68, 636, "Bounded benefit scope", (143, 340))
    callout(draw, 2, 455, 636, "Direct selection after comparison", (494, 545))
    callout(draw, 3, 917, 636, "Editable cost and dependent summary", (1030, 615))
    image.save(path)


def hr_future(path):
    image = Image.new("RGB", (1400, 740), c(MIST))
    draw = ImageDraw.Draw(image)
    shell(draw, "HR workspace")
    draw.rectangle((43, 120, 288, 685), fill=c(INK))
    text(draw, (68, 150), "ENROLLMENT", 15, True, SKY)
    for index, item in enumerate(["Employee", "Dependents", "Medical", "Dental", "Vision", "Review"]):
        y = 194 + index * 63
        rr(draw, (62, y, 265, y + 43), 10, "24485C" if item == "Medical" else INK)
        text(draw, (82, y + 11), item, 16, item == "Medical", WHITE)
        if item in ("Dependents", "Medical"):
            draw.ellipse((239, y + 13, 257, y + 31), fill=c(CORAL if item == "Medical" else GREEN))
    text(draw, (325, 130), "Enrollment workbench", 30, True)
    text(draw, (325, 170), "Avery Morgan  •  2027 Open Enrollment", 20, False, GRAY)
    rr(draw, (325, 208, 920, 258), 12, "FFF4D8", SUN, 2)
    text(draw, (348, 223), "Unsaved changes", 17, True)
    text(draw, (505, 223), "Your manual work will remain open while you review an import.", 16, False, GRAY)
    text(draw, (325, 285), "Medical coverage", 22, True)
    rr(draw, (325, 322, 920, 403), 14, WHITE, LINE, 2)
    text(draw, (350, 340), "Plan", 16, True)
    text(draw, (350, 365), "Choice PPO", 19, False)
    text(draw, (665, 340), "Coverage tier", 16, True)
    text(draw, (665, 365), "Employee + family", 19, False)
    text(draw, (325, 430), "Covered dependents", 22, True)
    rr(draw, (325, 468, 920, 548), 14, WHITE, CORAL, 3)
    text(draw, (350, 485), "Jordan Morgan", 18, True)
    text(draw, (350, 515), "Select at least one dependent for this coverage tier.", 16, False, CORAL)
    rr(draw, (325, 580, 522, 625), 14, INK)
    text(draw, (369, 592), "Save draft", 17, True, WHITE)
    rr(draw, (544, 580, 750, 625), 14, GREEN)
    text(draw, (574, 592), "Review enrollment", 17, True, WHITE)
    rr(draw, (965, 130, 1338, 392), 20, SKY, LINE, 2)
    text(draw, (995, 158), "Bulk file upload", 21, True)
    text(draw, (995, 195), "CSV or JSON", 17, False, GRAY)
    rr(draw, (995, 230, 1308, 302), 14, WHITE, LINE, 2)
    text(draw, (1056, 247), "Choose a file", 19, True)
    text(draw, (1044, 277), "Opens preflight review", 15, False, GRAY)
    text(draw, (995, 330), "Latest batch  •  3 rows need attention", 15, True, CORAL)
    rr(draw, (965, 425, 1338, 564), 20, WHITE, LINE, 2)
    text(draw, (995, 452), "Completion", 20, True)
    text(draw, (995, 488), "4 of 5 sections complete", 18, False, GRAY)
    rr(draw, (995, 525, 1275, 544), 10, GREEN)
    callout(draw, 1, 300, 653, "Rail status", (170, 610))
    callout(draw, 2, 470, 653, "Visible validation before review", (600, 547))
    callout(draw, 3, 935, 653, "Upload never discards manual work", (1120, 390))
    image.save(path)


def import_future(path):
    image = Image.new("RGB", (1400, 740), c(MIST))
    draw = ImageDraw.Draw(image)
    shell(draw, "HR workspace  •  import preflight")
    text(draw, (62, 130), "October elections csv", 31, True)
    text(draw, (62, 172), "148 employees  •  CSV  •  Uploaded today", 20, False, GRAY)
    steps = [("1", "Uploaded", GREEN), ("2", "Validated", GREEN), ("3", "Review issues", CORAL), ("4", "Import", WHITE)]
    for index, (number, title, fill) in enumerate(steps):
        x = 76 + index * 260
        draw.ellipse((x, 227, x + 45, 272), fill=c(fill), outline=c(GREEN if fill == WHITE else fill), width=3)
        text(draw, (x + 15, 237), number, 17, True, WHITE if fill != WHITE else GREEN)
        text(draw, (x + 60, 238), title, 18, True)
    rr(draw, (62, 315, 890, 598), 20, WHITE, LINE, 2)
    text(draw, (92, 345), "Preflight results", 24, True)
    for y, name, outcome, color in [(404, "Employee records", "148 ready", GREEN), (461, "Rows needing attention", "3 issues", CORAL), (518, "No records imported", "Review required", INK)]:
        rr(draw, (92, y, 850, y + 42), 10, MIST)
        text(draw, (115, y + 10), name, 16, True)
        text(draw, (645, y + 10), outcome, 16, True, color)
    rr(draw, (950, 315, 1338, 598), 20, SKY, LINE, 2)
    spaceship(draw, 1142, 383, 0.72)
    text(draw, (985, 445), "Import safeguard", 21, True)
    text(draw, (985, 482), "Fix the 3 row issues before", 17, False, GRAY)
    text(draw, (985, 508), "records can be imported.", 17, False, GRAY)
    rr(draw, (985, 544, 1250, 579), 14, INK)
    text(draw, (1030, 552), "Review row issues", 15, True, WHITE)
    callout(draw, 1, 65, 645, "Status is explicit at every stage", (260, 575))
    callout(draw, 2, 555, 645, "Counts reconcile before import", (670, 560))
    callout(draw, 3, 990, 645, "Friendly guide explains the safe next step", (1142, 598))
    image.save(path)


def fill(cell, value):
    props = cell._tc.get_or_add_tcPr()
    shade = OxmlElement("w:shd")
    shade.set(qn("w:fill"), value)
    props.append(shade)


def border(cell):
    props = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "6")
        element.set(qn("w:color"), "D9D9D9")
        borders.append(element)
    props.append(borders)


def set_margins(cell):
    props = cell._tc.get_or_add_tcPr()
    margins = OxmlElement("w:tcMar")
    for name in ("top", "start", "bottom", "end"):
        item = OxmlElement(f"w:{name}")
        item.set(qn("w:w"), "110")
        item.set(qn("w:type"), "dxa")
        margins.append(item)
    props.append(margins)


def write_cell(cell, value, bold=False, color=INK, size=9.5):
    paragraph = cell.paragraphs[0]
    paragraph.paragraph_format.space_after = Pt(0)
    run = paragraph.add_run(value)
    run.bold = bold
    run.font.name = "Arial"
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    border(cell)
    set_margins(cell)


def mark_header(row):
    props = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    props.append(header)


def add_paragraph(doc, value="", size=11, after=7, before=0, bold=False, color=INK, italic=False):
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(before)
    paragraph.paragraph_format.space_after = Pt(after)
    paragraph.paragraph_format.line_spacing = 1.16
    run = paragraph.add_run(value)
    run.bold = bold
    run.italic = italic
    run.font.name = "Arial"
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    return paragraph


def heading(doc, value, level=1):
    paragraph = doc.add_paragraph(style=f"Heading {level}")
    paragraph.paragraph_format.space_before = Pt(15 if level == 1 else 9)
    paragraph.paragraph_format.space_after = Pt(6)
    paragraph.paragraph_format.keep_with_next = True
    run = paragraph.add_run(value)
    run.font.name = "Arial"
    run.font.color.rgb = RGBColor(0, 0, 0)
    return paragraph


def image(doc, path, caption):
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_after = Pt(3)
    shape = paragraph.add_run().add_picture(str(path), width=Inches(6.85))
    shape._inline.docPr.set("descr", caption)
    shape._inline.docPr.set("title", caption)
    caption_p = doc.add_paragraph()
    caption_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption_p.paragraph_format.space_after = Pt(9)
    run = caption_p.add_run(caption)
    run.italic = True
    run.font.name = "Arial"
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor.from_string(GRAY)


def table(doc, headings, rows, widths=None):
    grid = doc.add_table(rows=1, cols=len(headings))
    grid.style = "Table Grid"
    grid.alignment = WD_TABLE_ALIGNMENT.CENTER
    header = grid.rows[0]
    for index, value in enumerate(headings):
        fill(header.cells[index], INK)
        write_cell(header.cells[index], value, True, WHITE, 9)
    mark_header(header)
    for row_index, row in enumerate(rows):
        cells = grid.add_row().cells
        for index, value in enumerate(row):
            if row_index % 2:
                fill(cells[index], MIST)
            write_cell(cells[index], value, index == 0, INK, 9)
    return grid


def build():
    ASSETS.mkdir(exist_ok=True)
    employee = ASSETS / "recommended-employee-orbit-guide.png"
    hr = ASSETS / "recommended-hr-workbench.png"
    upload = ASSETS / "recommended-import-preflight.png"
    employee_future(employee)
    hr_future(hr)
    import_future(upload)

    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.68)
    section.bottom_margin = Inches(0.62)
    section.left_margin = Inches(0.78)
    section.right_margin = Inches(0.78)
    styles = doc.styles
    styles["Normal"].font.name = "Arial"
    styles["Normal"].font.size = Pt(10.8)
    styles["Normal"].font.color.rgb = RGBColor.from_string(INK)
    for style, size in (("Title", 28), ("Heading 1", 19), ("Heading 2", 13)):
        styles[style].font.name = "Arial"
        styles[style].font.size = Pt(size)
        styles[style].font.color.rgb = RGBColor(0, 0, 0)
        styles[style].font.bold = True
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = footer.add_run("New Employee Enrollment  |  UI recommendation packet for C suite and stakeholder review")
    run.font.name = "Arial"
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor.from_string(GRAY)

    title = doc.add_paragraph(style="Title")
    title.paragraph_format.space_after = Pt(9)
    run = title.add_run("New Employee Enrollment UI Recommendation Packet")
    run.font.name = "Arial"
    run.font.size = Pt(28)
    run.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    add_paragraph(doc, "C suite and stakeholder decision review", 14, 12, color=GRAY)
    logo = doc.add_paragraph()
    logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    shape = logo.add_run().add_picture(str(BASE / "round-spaceship-mascot.png"), width=Inches(1.65))
    shape._inline.docPr.set("descr", "Alien spaceship guide with green flashing status lights")
    shape._inline.docPr.set("title", "Alien spaceship guide with green flashing status lights")
    heading(doc, "Decision requested", 1)
    add_paragraph(doc, "Approve Orbit Guide as the employee enrollment experience and Enrollment Workbench as the HR manual-enrollment experience. Use Import Control Panel as the preflight mode opened from the Workbench upload area. Treat the alternate concepts as supporting patterns rather than separate products.", 11, 10)
    table(doc, ["Area", "Decision", "Why now"], [
        ("Employee self service", "Orbit Guide with Briefing safeguards", "It keeps cost, covered dependents, and choices visible while preserving a focused conversation."),
        ("HR manual work", "Enrollment Workbench", "It best supports repeat desktop work while preserving the requested upper-right upload access."),
        ("Bulk imports", "Import Control Panel with later Batch Inbox", "It makes preflight and no-import-yet status explicit; a queue can follow if volume proves it necessary."),
    ])
    heading(doc, "What changes before implementation", 2)
    add_paragraph(doc, "The proposed changes close the highest-risk gaps: uncertain scope, accidental plan choice, incomplete dependent coverage, unsaved HR work, ambiguous upload status, and insufficient confirmation before records are committed.", 11, 0)
    doc.add_page_break()

    heading(doc, "Employee recommendation  Orbit Guide", 1)
    add_paragraph(doc, "Keep Orbit Guide’s live enrollment summary and use Benefit Briefing’s visible progress and clear scope language. The result is a guided, benefit-only conversation rather than a general chatbot or a rigid form wizard.", 11, 7)
    image(doc, employee, "Recommended employee future state  The alien spaceship guide stays quiet while scope, progress, selection, and the live cost summary remain explicit.")
    table(doc, ["Change", "Decision benefit", "Implementation note"], [
        ("Bounded benefit scope", "Prevents off-topic drift and makes the assistant’s role understandable.", "Offer guided choices; redirect unrelated prompts to the correct team without generating a general answer."),
        ("Comparison then selection", "Employees can understand a plan before committing, without confusing comparison with the action to select.", "Make the selected card and primary selection action unmistakable; retain comparison as a secondary action."),
        ("Persistent editable summary", "Reduces anxiety by showing cost, plan, and covered dependents before submission.", "Provide Change links and a final review; the application computes the cost and eligibility, not the model."),
        ("Accessible progress and motion", "Makes the journey understandable without relying on animation or color.", "Use text status, visible step count, and reduced-motion support for the orbit treatment."),
    ])
    heading(doc, "Measures to validate", 2)
    add_paragraph(doc, "Can employees explain the next step, identify their per-pay-period deduction, correct a dependent selection, and understand what will happen when they submit?", 11, 0)
    doc.add_page_break()

    heading(doc, "HR recommendation  Enrollment Workbench", 1)
    add_paragraph(doc, "Implement the Workbench as one desktop-first screen. The manual form owns most of the workspace; the upload card remains in the upper right and opens import preflight without replacing or discarding the active employee record.", 11, 7)
    image(doc, hr, "Recommended HR future state  Progress and errors appear in the section rail, validation is visible in context, and the upper-right upload area protects unsaved manual work.")
    table(doc, ["Change", "Decision benefit", "Implementation note"], [
        ("Section rail with states", "HR can scan what is complete, incomplete, or blocked before review.", "Use text, icons, and error counts together; never use red or green alone."),
        ("Real editable form surface", "Supports accurate manual updates rather than a dashboard of summary cards.", "Show in-context field validation and retain a dedicated review action before submission."),
        ("Unsaved-work protection", "Prevents the import workflow from interrupting or losing manual edits.", "Keep the draft in place while preflight opens in a panel or route; ask before navigating away."),
        ("Action hierarchy", "Separates draft-saving from final review and uses color semantically.", "Reserve green for success/status; use the primary action color for Save draft and Review enrollment."),
    ])
    doc.add_page_break()

    heading(doc, "Import recommendation  Import Control Panel", 1)
    add_paragraph(doc, "The Workbench upload card should open this explicit preflight mode. Batch Inbox is deferred as a history and queue screen for recurring high-volume windows, not the initial upload experience.", 11, 7)
    image(doc, upload, "Recommended import future state  The four-stage lifecycle, reconciled counts, and a no-records-imported safeguard make the safe next action clear.")
    table(doc, ["Required state", "Stakeholder expectation", "Prototype proof"], [
        ("File chosen", "File type and filename are clear; CSV and JSON are supported.", "Show selected-file replacement and cancellation without hidden upload."),
        ("Preflight", "No employee record is committed while validation is incomplete.", "State that no records have been imported and show validation progress."),
        ("Rows need attention", "Counts and remediation are visible before an import can proceed.", "Show a row-error view with safe corrective actions and a return to review."),
        ("Completed import", "HR can verify what succeeded, what failed, and what needs follow-up.", "Show reconciled totals, completion time, and a link to batch history."),
    ])
    heading(doc, "Controls that must not be delegated to AI", 2)
    add_paragraph(doc, "Plan eligibility, coverage-tier rules, payroll deduction, period status, contact ownership, import counts, and final persistence remain deterministic application controls. The assistant may guide the employee but may not decide or override these rules.", 11, 0)
    doc.add_page_break()

    heading(doc, "Prototype scope and approval", 1)
    add_paragraph(doc, "The next prototype should prove comprehension and error recovery, not merely visual preference. It should be tested with employees, HR operators, Security, and product owners before build commitments are made.", 11, 9)
    table(doc, ["Prototype", "Must include", "Approval question"], [
        ("Employee Orbit Guide", "Dependents, comparison, selection, live summary, off-topic redirect, final confirmation.", "Can an employee complete enrollment and explain the cost with confidence?"),
        ("HR Enrollment Workbench", "Editable form, field errors, unsaved-change behavior, section status, review and draft states.", "Can HR correct errors and resume work without losing context?"),
        ("Import Control Panel", "File selection, validation, row errors, pre-import review, completion result.", "Can HR tell whether records have been imported and what action is required next?"),
    ])
    heading(doc, "Approval request", 2)
    add_paragraph(doc, "Approve the three recommended patterns and authorize clickable prototype work. Defer Batch Inbox until pilot evidence shows concurrent or recurring batch volume warrants a queue. Preserve the light mission-control palette and the alien spaceship with green flashing lights as a restrained guide, not a competing mascot.", 11, 8)
    heading(doc, "Open stakeholder decisions", 2)
    for question in [
        "What enrollment actions require explicit final confirmation versus draft save?",
        "What HR error or exception requires escalation rather than self-service correction?",
        "What batch volume or operational cadence justifies introducing Batch Inbox?",
        "What supported desktop widths and reduced-motion behavior are required for pilot?",
    ]:
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.space_after = Pt(5)
        bullet = paragraph.add_run("• ")
        bullet.font.color.rgb = RGBColor.from_string(GREEN)
        bullet.bold = True
        run = paragraph.add_run(question)
        run.font.name = "Arial"
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor.from_string(INK)
    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
