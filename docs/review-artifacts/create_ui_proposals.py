from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

BASE = Path(__file__).parent
OUT = BASE / "New_Employee_Enrollment_UI_Proposals.docx"
INK = "183143"; SKY = "DDF3F4"; MIST = "F5FAF9"; GREEN = "32B875"; CORAL = "F28C72"; SUN = "F6C85F"; LINE = "C9D8DC"; WHITE = "FFFFFF"; GRAY = "5B6B73"

def f(size, bold=False):
    candidates = ["/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial.ttf"]
    if bold:
        candidates = [x.replace("Arial.ttf", "Arial Bold.ttf") for x in candidates] + candidates
    for p in candidates:
        if Path(p).exists(): return ImageFont.truetype(p, size)
    return ImageFont.load_default()

FB, FBOLD, FM, FMBOLD = f(28), f(28, True), f(21), f(21, True)

def color(value):
    return "#" + value if value and len(value) == 6 and not value.startswith("#") else value
def rr(draw, box, r, fill, outline=None, width=1): draw.rounded_rectangle(box, radius=r, fill=color(fill), outline=color(outline), width=width)
def txt(draw, xy, text, font=FM, fill=INK, anchor=None):
    draw.text(xy, text, font=font, fill=color(fill), anchor=anchor)

def ship(draw, x, y, scale=1):
    # Original geometric mascot used only as a schematic inside UI diagrams.
    draw.ellipse((x-37*scale, y-27*scale, x+37*scale, y+27*scale), fill="#F8F4E9", outline="#183143", width=max(1,int(2*scale)))
    draw.ellipse((x-20*scale, y-16*scale, x+20*scale, y+16*scale), fill="#183143")
    draw.ellipse((x-11*scale, y-8*scale, x-3*scale, y), fill="#DDF3F4")
    draw.ellipse((x+11*scale, y-10*scale, x+17*scale, y-4*scale), fill="#32B875")
    draw.ellipse((x+11*scale, y+3*scale, x+17*scale, y+9*scale), fill="#32B875")
    draw.line((x-48*scale,y+22*scale,x-68*scale,y+40*scale),fill="#F28C72",width=max(1,int(4*scale)))
    draw.line((x+48*scale,y+22*scale,x+68*scale,y+40*scale),fill="#F28C72",width=max(1,int(4*scale)))

def label(draw, x, y, text, fill="#183143"):
    rr(draw, (x,y,x+len(text)*10+26,y+31), 15, fill)
    txt(draw, (x+13,y+6), text, f(14, True), WHITE)

def screen(path, name, role, variant):
    im = Image.new("RGB", (1400, 740), "#F5FAF9")
    d = ImageDraw.Draw(im)
    rr(d, (25, 20, 1375, 720), 26, "#FFFFFF", "#C9D8DC", 3)
    # application bar
    rr(d, (25,20,1375,105), 26, "#DDF3F4")
    d.rectangle((25,75,1375,105), fill="#DDF3F4")
    ship(d, 85, 63, .55)
    txt(d, (135,42), "New Employee Enrollment", FBOLD)
    txt(d, (1130,48), role, FM, GRAY)
    label(d, 1260, 38, "DRAFT", "#183143")
    if variant == "orbit":
        txt(d,(70,137),"Choose medical coverage", f(29,True))
        txt(d,(70,181),"I will guide you through one benefit at a time.", FM, GRAY)
        # chat
        rr(d,(70,235,745,350),20,"#DDF3F4")
        txt(d,(95,260),"Your medical plan should fit who you cover and what", FM)
        txt(d,(95,290),"matters most to you. Want to compare your options?", FM)
        for i,(title,cost,accent) in enumerate([("Value PPO","$84 / pay period",SKY),("Choice PPO","$122 / pay period","E8F2ED")]):
            x=70+i*340; rr(d,(x,380,x+310,555),20,"#FFFFFF",LINE,2); txt(d,(x+25,405),title,FMBOLD); txt(d,(x+25,440),cost,FM,GRAY); rr(d,(x+25,482,x+173,526),16,"#183143"); txt(d,(x+46,493),"Compare",f(16,True),WHITE)
        rr(d,(795,135,1327,657),22,"#183143")
        txt(d,(830,170),"YOUR ENROLLMENT",f(16,True),"#DDF3F4")
        for y,a,b in [(235,"Medical","Not selected"),(325,"Dental","Next"),(415,"Vision","Next")]:
            rr(d,(830,y,1292,y+65),12,"#24485C"); txt(d,(850,y+14),a,FMBOLD,WHITE); txt(d,(1110,y+18),b,f(15),"#DDF3F4")
        txt(d,(830,535),"Estimated deduction",FM,"#DDF3F4"); txt(d,(830,570),"$0.00",f(30,True),WHITE)
        label(d,70,620,"Guided choices keep this conversation on benefits")
    elif variant == "briefing":
        txt(d,(70,137),"Enrollment briefing",f(30,True))
        txt(d,(70,180),"Step 2 of 5  •  Medical coverage",FM,GRAY)
        # constellation line
        d.line((80,225,675,225),fill="#A9DCC5",width=5)
        for x in [80,230,380,530,675]: d.ellipse((x-10,215,x+10,235), fill="#32B875" if x<380 else "#FFFFFF", outline="#32B875", width=3)
        rr(d,(70,270,1300,442),22,"#FFFFFF",LINE,2)
        txt(d,(100,300),"A lower premium now or more predictable costs later?",f(24,True))
        txt(d,(100,344),"Compare the two plans before you make your selection.",FM,GRAY)
        for x,labeltext in [(100,"Compare plans"),(350,"Show costs first")]:
            rr(d,(x,382,x+205,426),16,"#183143" if x==100 else "#DDF3F4"); txt(d,(x+20,392),labeltext,f(15,True),WHITE if x==100 else INK)
        rr(d,(70,485,1300,650),18,"#DDF3F4")
        txt(d,(100,515),"Benefit only assistant",f(18,True))
        txt(d,(100,552),"I can help with benefit choices, dependents, costs, and your confirmation.",FM,GRAY)
        txt(d,(100,587),"For other questions, I will point you to the right team.",FM,GRAY)
        label(d,1010,535,"SAFE SCOPE",GREEN)
    elif variant in ("workbench","desk"):
        d.rectangle((55,120,275,680), fill="#183143")
        txt(d,(78,151),"ENROLLMENT",f(15,True),"#DDF3F4")
        for i,t in enumerate(["Employee","Dependents","Medical","Dental","Vision","Review"]):
            rr(d,(72,195+i*65,252,240+i*65),10,"#24485C" if i==2 else "#183143"); txt(d,(90,208+i*65),t,f(16, i==2),WHITE)
        txt(d,(315,137),"Employee dossier" if variant=="desk" else "Enrollment workbench",f(28,True))
        txt(d,(315,179),"Avery Morgan  •  2027 Open Enrollment",FM,GRAY)
        if variant == "workbench":
            for y,title,sub in [(240,"Medical coverage","Choice PPO  •  Employee + family"),(350,"Covered dependents","Jordan Morgan, Riley Morgan"),(460,"Payroll deduction","$122 per pay period")]:
                rr(d,(315,y,925,y+85),16,"#FFFFFF",LINE,2); txt(d,(340,y+18),title,FMBOLD); txt(d,(340,y+49),sub,FM,GRAY)
        else:
            for y,title,sub in [(240,"1  Employee details","Verified employee record"),(350,"2  Dependents","Two contacts ready for coverage"),(460,"3  Benefit elections","Medical plan needs review")]:
                rr(d,(315,y,925,y+85),16,"#FFFFFF",LINE,2); txt(d,(340,y+18),title,FMBOLD); txt(d,(340,y+49),sub,FM,GRAY)
        rr(d,(970,135,1325,405),20,"#DDF3F4",LINE,2)
        txt(d,(998,164),"Bulk file upload",f(20,True))
        rr(d,(998,210,1297,300),14,"#FFFFFF",LINE,2); txt(d,(1053,229),"Drop CSV or JSON",f(17,True)); txt(d,(1064,260),"or browse files",f(15),GRAY)
        txt(d,(998,327),"Templates and import history",f(15,True),INK)
        txt(d,(998,355),"CSV  •  JSON  •  Last batch complete",f(13),GRAY)
        rr(d,(970,445,1325,615),20,"#FFFFFF",LINE,2)
        txt(d,(998,472),"Completion",f(18,True)); txt(d,(998,510),"4 of 5 sections complete",FM,GRAY)
        rr(d,(998,555,1265,584),14,"#32B875"); txt(d,(1015,560),"Save draft",f(15,True),WHITE)
    elif variant in ("control","inbox"):
        txt(d,(70,137),"Bulk enrollment import",f(29,True))
        txt(d,(70,177),"Upload, validate, then review employee elections.",FM,GRAY)
        if variant == "control":
            steps=[("1","Upload"),("2","Validate"),("3","Import"),("4","Review")]
            for i,(n,t) in enumerate(steps):
                x=90+i*250; d.ellipse((x,235,x+42,277),fill="#32B875" if i<2 else "#FFFFFF",outline="#32B875",width=3); txt(d,(x+15,244),n,f(15,True),WHITE if i<2 else GREEN); txt(d,(x+55,243),t,f(17,True))
            rr(d,(70,330,900,635),22,"#FFFFFF",LINE,3); txt(d,(360,400),"Drop your CSV or JSON file here",f(23,True)); txt(d,(413,440),"Each employee is validated before import.",FM,GRAY); rr(d,(395,505,590,552),16,"#183143"); txt(d,(425,517),"Choose file",f(16,True),WHITE)
            rr(d,(955,235,1315,635),22,"#DDF3F4",LINE,2); ship(d,1135,330,.75); txt(d,(992,415),"Preflight check",f(21,True)); txt(d,(992,460),"Ready for validation",FM,GRAY); txt(d,(992,505),"CSV and JSON accepted",FM,GRAY); label(d,992,555,"NO RECORDS IMPORTED YET",GREEN)
        else:
            rr(d,(70,235,430,655),20,"#183143"); txt(d,(100,267),"Batch inbox",f(21,True),WHITE)
            for i,(title,status) in enumerate([("October elections csv","Needs review"),("September corrections json","Complete"),("New import","Upload")]):
                y=320+i*94; rr(d,(92,y,408,y+74),13,"#24485C"); txt(d,(112,y+14),title,f(15,True),WHITE); txt(d,(112,y+42),status,f(14),"#F6C85F" if i==0 else "#A9DCC5")
            rr(d,(475,235,1315,655),20,"#FFFFFF",LINE,2); txt(d,(510,270),"October elections csv",f(24,True)); txt(d,(510,313),"148 employees  •  CSV  •  Uploaded today",FM,GRAY)
            for y,l,v,c in [(380,"Employee records","148 ready",GREEN),(445,"Rows needing attention","3",CORAL),(510,"Import action","Review issues",INK)]:
                rr(d,(510,y,1250,y+48),12,"#F5FAF9"); txt(d,(532,y+13),l,f(16,True)); txt(d,(1070,y+13),v,f(16,True),c)
            rr(d,(510,575,720,623),16,"#183143"); txt(d,(538,587),"Review before import",f(15,True),WHITE)
    txt(d,(70,684), name, f(14,True), GRAY)
    im.save(path)

def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr(); shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), color); tcPr.append(shd)
def borders(cell, color="D9D9D9"):
    tcPr = cell._tc.get_or_add_tcPr(); b = OxmlElement('w:tcBorders')
    for edge in ('top','left','bottom','right','insideH','insideV'):
        e=OxmlElement(f'w:{edge}'); e.set(qn('w:val'),'single'); e.set(qn('w:sz'),'6'); e.set(qn('w:color'),color); b.append(e)
    tcPr.append(b)
def cell_text(cell, text, bold=False, color=INK, size=9.5):
    p=cell.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.LEFT; r=p.add_run(text); r.bold=bold; r.font.size=Pt(size); r.font.color.rgb=RGBColor.from_string(color); r.font.name='Arial'; cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
def set_cell_margin(cell, top=100, start=120, bottom=100, end=120):
    tc=cell._tc; tcPr=tc.get_or_add_tcPr(); tcMar=tcPr.first_child_found_in('w:tcMar')
    if tcMar is None: tcMar=OxmlElement('w:tcMar'); tcPr.append(tcMar)
    for m,v in [('top',top),('start',start),('bottom',bottom),('end',end)]:
        node=tcMar.find(qn(f'w:{m}'))
        if node is None: node=OxmlElement(f'w:{m}'); tcMar.append(node)
        node.set(qn('w:w'),str(v)); node.set(qn('w:type'),'dxa')
def mark_header(row):
    trPr = row._tr.get_or_add_trPr(); node = OxmlElement('w:tblHeader'); node.set(qn('w:val'),'true'); trPr.append(node)
def set_alt(shape, description):
    shape._inline.docPr.set('descr', description)
    shape._inline.docPr.set('title', description)
def add_run(p, text, bold=False, size=11, color=INK, italic=False):
    r=p.add_run(text); r.bold=bold; r.italic=italic; r.font.name='Arial'; r.font.size=Pt(size); r.font.color.rgb=RGBColor.from_string(color); return r
def add_para(doc, text="", size=11, before=0, after=7, bold=False, color=INK, style=None):
    p=doc.add_paragraph(style=style); p.paragraph_format.space_before=Pt(before); p.paragraph_format.space_after=Pt(after); p.paragraph_format.line_spacing=1.18; add_run(p,text,bold,size,color); return p
def keep(p): p.paragraph_format.keep_with_next=True
def h(doc, text, level=1):
    p=doc.add_paragraph(style=f'Heading {level}'); p.paragraph_format.space_before=Pt(16 if level==1 else 10); p.paragraph_format.space_after=Pt(7); p.paragraph_format.keep_with_next=True
    r=p.add_run(text); r.font.name='Arial'; r.font.color.rgb=RGBColor(0,0,0); return p
def figure(doc,path,caption):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(5); p.paragraph_format.space_after=Pt(3); shape=p.add_run().add_picture(str(path),width=Inches(6.85)); set_alt(shape, caption)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(10); add_run(p,caption,False,9,GRAY,True)
def page_break(doc): doc.add_page_break()

def build():
    assets=BASE/'graphics'; assets.mkdir(exist_ok=True)
    screens={
        'orbit':('Employee design 1  Orbit Guide','Employee self service','orbit'),
        'briefing':('Employee design 2  Benefit Briefing','Employee self service','briefing'),
        'workbench':('HR design 1  Enrollment Workbench','HR workspace','workbench'),
        'desk':('HR design 2  Enrollment Desk','HR workspace','desk'),
        'control':('HR upload design 1  Import Control Panel','HR workspace','control'),
        'inbox':('HR upload design 2  Batch Inbox','HR workspace','inbox')}
    for k,(n,r,v) in screens.items(): screen(assets/f'{k}.png',n,r,v)
    doc=Document(); sec=doc.sections[0]; sec.top_margin=Inches(.7); sec.bottom_margin=Inches(.65); sec.left_margin=Inches(.78); sec.right_margin=Inches(.78)
    styles=doc.styles; styles['Normal'].font.name='Arial'; styles['Normal'].font.size=Pt(10.7); styles['Normal'].font.color.rgb=RGBColor.from_string(INK)
    for sn,sz in [('Title',28),('Heading 1',19),('Heading 2',13)]:
        s=styles[sn]; s.font.name='Arial'; s.font.size=Pt(sz); s.font.color.rgb=RGBColor(0,0,0); s.font.bold=True
    # footer
    footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER; add_run(footer,'New Employee Enrollment  |  UI proposals for executive and end user review',False,8,GRAY)
    # Cover
    p=doc.add_paragraph(style='Title'); p.paragraph_format.space_after=Pt(10); add_run(p,'New Employee Enrollment UI Proposals',True,28,'000000')
    add_para(doc,'Executive and end user review packet',14,after=13,color=GRAY)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; shape=p.add_run().add_picture(str(BASE/'round-spaceship-mascot.png'),width=Inches(2.2)); set_alt(shape, 'Round spaceship guide with two green lights and a pale blue orbital path')
    add_para(doc,'Purpose',11,18,4,True)
    add_para(doc,'This packet presents two employee chat concepts, two HR manual-enrollment concepts, and two HR bulk-upload concepts. It is intended to help reviewers select a visual direction and identify workflow questions before implementation.',11,after=10)
    h(doc,'Recommendation',1)
    add_para(doc,'Advance Orbit Guide for employee self service and Enrollment Workbench with Import Control Panel for HR. Together they create one calm, guided system while giving each role the amount of structure it needs.',11,after=12)
    h(doc,'Review decision',2)
    add_para(doc,'Confirm the preferred direction, the level of visible guidance, and which concepts should move into clickable prototypes.',11,after=0)
    page_break(doc)
    # foundation
    h(doc,'Shared visual foundation',1)
    add_para(doc,'All concepts use a calm mission control theme. The visual system is intentionally light, reassuring, and practical for decisions that can feel personal or complex. The round spaceship is a friendly guide, not a brand mascot that competes with the content.',11,after=10)
    table=doc.add_table(rows=1,cols=3); table.alignment=WD_TABLE_ALIGNMENT.CENTER; table.style='Table Grid'
    heads=['Element','Direction','Why it matters']
    for i,x in enumerate(heads): shade(table.rows[0].cells[i],INK); cell_text(table.rows[0].cells[i],x,True,WHITE,9.5); set_cell_margin(table.rows[0].cells[i])
    mark_header(table.rows[0])
    rows=[('Palette','Ink, sky, mist, mission green, coral, sun','Creates clarity without a clinical or heavy interface.'),('Type','Clear sans serif with a strong hierarchy','Supports scanning by employees and high-volume HR work.'),('Guidance','One decision at a time with plain-language explanations','Makes benefit selection easier to complete correctly.'),('Accessibility','Text labels, icons, and status wording work together','Avoids relying on color alone for progress or errors.')]
    for ri,row in enumerate(rows):
        cells=table.add_row().cells
        for i,x in enumerate(row): shade(cells[i],'F5FAF9' if ri%2 else WHITE); borders(cells[i]); set_cell_margin(cells[i]); cell_text(cells[i],x,i==0)
    add_para(doc,'Conversation boundary',11,14,3,True)
    add_para(doc,'The employee assistant is scoped to benefit elections, plan comparisons, dependents, costs, and confirmation. The interface should use guided response choices at each step and state its scope plainly. Off-topic input receives a brief redirect to an allowed task; it does not attempt to answer unrelated questions.',11,after=0)
    page_break(doc)
    # employee designs
    h(doc,'Employee self service chat',1)
    add_para(doc,'Employees use a desktop-first guided conversation to make their own benefit selections. The experience should remain focused on their enrollment, use plan comparisons only when helpful, and finish with a clear confirmation summary.',11,after=8)
    h(doc,'Orbit Guide',2)
    add_para(doc,'A conversational guide paired with a live enrollment summary. The left side handles one decision at a time; the right side continuously shows selections, covered dependents, and the estimated payroll deduction. The animated orbit makes progress visible without turning the experience into a wizard.',10.7,after=5)
    figure(doc,assets/'orbit.png','Concept screen 1  Orbit Guide uses a persistent enrollment summary to make choices feel reversible and clear.')
    h(doc,'Benefit Briefing',2)
    add_para(doc,'A more structured alternative that reads like a short briefing. It favors large guided choices, plain-language education, and an explicit scope statement. The constellation progress line makes the journey visible while preserving the feeling of a conversation.',10.7,after=5)
    figure(doc,assets/'briefing.png','Concept screen 2  Benefit Briefing gives employees a focused, bounded choice at each stage.')
    page_break(doc)
    # HR manual
    h(doc,'HR manual enrollment workspace',1)
    add_para(doc,'HR needs a desktop workspace that supports careful updates to one employee record while retaining access to bulk imports. In both concepts, the manual form is the primary area and the upload function remains in the upper right.',11,after=8)
    h(doc,'Enrollment Workbench',2)
    add_para(doc,'A task-focused workspace for repeat HR activity. A dark section rail gives immediate orientation, while broad editable sections keep employee details, covered dependents, elections, and payroll cost in one working view. The upload card remains available without interrupting manual work.',10.7,after=5)
    figure(doc,assets/'workbench.png','Concept screen 3  Enrollment Workbench prioritizes fast, accurate manual updates.')
    h(doc,'Enrollment Desk',2)
    add_para(doc,'A warmer dossier-style alternative. Accordion chapters make a complete employee record approachable and help reviewers inspect each section in sequence. It is a good fit if HR values reviewability and a less operational tone over dense throughput.',10.7,after=5)
    figure(doc,assets/'desk.png','Concept screen 4  Enrollment Desk frames the record as a readable employee dossier.')
    page_break(doc)
    # uploads
    h(doc,'HR bulk file upload',1)
    add_para(doc,'Bulk import must clearly distinguish upload, validation, review, and completed import. CSV and JSON are supported based on the file suffix. Records require employee data before associated contacts or selections can be created; the interface should surface issues before HR completes the batch.',11,after=8)
    h(doc,'Import Control Panel',2)
    add_para(doc,'A step-by-step import panel for HR teams that want an explicit preflight experience. The trajectory shows where the batch is in its journey, while a preflight card makes it clear that no records are imported until validation and review are complete.',10.7,after=5)
    figure(doc,assets/'control.png','Concept screen 5  Import Control Panel makes the import sequence and preflight status explicit.')
    h(doc,'Batch Inbox',2)
    add_para(doc,'A queue-oriented alternative for teams managing multiple files. HR can see new, incomplete, and completed batches at a glance, then open a selected batch to resolve row-level issues before import. This option is strongest for recurring enrollment windows.',10.7,after=5)
    figure(doc,assets/'inbox.png','Concept screen 6  Batch Inbox treats uploads as reviewable work items rather than one-off actions.')
    page_break(doc)
    # decision support
    h(doc,'Review guide',1)
    add_para(doc,'Use this final page to capture feedback during executive and end user sessions. The aim is to decide what to prototype, not to settle every interaction detail in the room.',11,after=10)
    table=doc.add_table(rows=1,cols=4); table.alignment=WD_TABLE_ALIGNMENT.CENTER; table.style='Table Grid'
    for i,x in enumerate(['Audience','Best direction','Primary strength','Decision to validate']): shade(table.rows[0].cells[i],INK); cell_text(table.rows[0].cells[i],x,True,WHITE,9)
    mark_header(table.rows[0])
    for row in [('Employees','Orbit Guide','Live summary makes choices and costs visible.','Does the persistent summary reduce uncertainty?'),('Employees','Benefit Briefing','Strongest choice containment and education.','Does the structure still feel conversational?'),('HR','Enrollment Workbench','Fast, durable manual entry for recurring work.','Is the rail helpful at the expected scale?'),('HR','Enrollment Desk','Readable record review with softer hierarchy.','Does it support enough throughput?'),('HR','Import Control Panel','Clear preflight and explicit import stages.','Are the stages enough to prevent errors?'),('HR','Batch Inbox','Best visibility across multiple import files.','Is batch volume high enough to justify a queue?')]:
        cells=table.add_row().cells
        for i,x in enumerate(row): shade(cells[i],'F5FAF9' if len(table.rows)%2 else WHITE); borders(cells[i]); set_cell_margin(cells[i]); cell_text(cells[i],x,i==0,size=8.5)
    h(doc,'Questions for the sessions',2)
    for t in ['Which screen makes the next action most obvious?','Where would an employee or HR user expect more explanation before committing?','Which status or cost detail needs to remain visible throughout the task?','What would make you hesitate to submit an enrollment or import a file?']:
        p=doc.add_paragraph(style=None); p.paragraph_format.space_after=Pt(6); add_run(p,'• ',True,11,GREEN); add_run(p,t,False,11)
    add_para(doc,'Proposed next step',11,14,4,True)
    add_para(doc,'Select the recommended employee and HR directions, then convert them into clickable desktop prototypes with empty, loading, validation-error, and confirmation states for usability review.',11,after=0)
    doc.save(OUT)
    print(OUT)

if __name__ == '__main__': build()
