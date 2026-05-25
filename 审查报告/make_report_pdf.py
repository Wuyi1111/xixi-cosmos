"""
make_report_pdf.py — 生成「息息·宇宙 v4.23.0 审查报告」PDF。

用法：
    cd 审查报告/
    python3 make_report_pdf.py

依赖：
    pip3 install reportlab

输出：
    审查报告/xixi-cosmos-v4.23.0-审查报告.pdf
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Flowable
)

# ── 字体注册 ─────────────────────────────────────────
FONT_REG = 'CN'
FONT_BOLD = 'CN-Bold'
pdfmetrics.registerFont(TTFont(FONT_REG, '/Library/Fonts/Arial Unicode.ttf'))
pdfmetrics.registerFont(TTFont(FONT_BOLD, '/System/Library/Fonts/STHeiti Medium.ttc'))

# ── 调色板 ───────────────────────────────────────────
INDIGO = HexColor('#6366f1')
INDIGO_LIGHT = HexColor('#e0e7ff')
INDIGO_DARK = HexColor('#4338ca')
RED = HexColor('#dc2626')
RED_BG = HexColor('#fee2e2')
ORANGE = HexColor('#ea580c')
ORANGE_BG = HexColor('#ffedd5')
AMBER = HexColor('#d97706')
AMBER_BG = HexColor('#fef3c7')
EMERALD = HexColor('#10b981')
EMERALD_BG = HexColor('#d1fae5')
GRAY = HexColor('#6b7280')
GRAY_LIGHT = HexColor('#f3f4f6')
GRAY_BORDER = HexColor('#e5e7eb')
TEXT = HexColor('#1f2937')
BG_CODE = HexColor('#f8fafc')

# ── 段落样式 ─────────────────────────────────────────
BODY = ParagraphStyle('Body', fontName=FONT_REG, fontSize=10, leading=16,
                     textColor=TEXT, spaceAfter=4)
BODY_SMALL = ParagraphStyle('BodySmall', fontName=FONT_REG, fontSize=9, leading=14,
                            textColor=TEXT, spaceAfter=3)
H1 = ParagraphStyle('H1', fontName=FONT_BOLD, fontSize=24, leading=30,
                    textColor=INDIGO, alignment=TA_CENTER, spaceAfter=8)
H2 = ParagraphStyle('H2', fontName=FONT_BOLD, fontSize=16, leading=24,
                    textColor=INDIGO_DARK, spaceBefore=18, spaceAfter=8)
H3 = ParagraphStyle('H3', fontName=FONT_BOLD, fontSize=12, leading=18,
                    textColor=TEXT, spaceBefore=10, spaceAfter=4)
BOLD_LINE = ParagraphStyle('Bold', fontName=FONT_BOLD, fontSize=10, leading=15,
                           textColor=TEXT, spaceAfter=3)
SUBTITLE = ParagraphStyle('Subtitle', fontName=FONT_REG, fontSize=11, leading=18,
                          textColor=GRAY, alignment=TA_CENTER)
CODE = ParagraphStyle('Code', fontName='Courier', fontSize=8.5, leading=12,
                     textColor=TEXT, backColor=BG_CODE,
                     leftIndent=8, rightIndent=8, spaceAfter=6,
                     borderColor=GRAY_BORDER, borderWidth=0.5, borderPadding=6)

def P(text, style=BODY):
    return Paragraph(text, style)

def B(text):
    return Paragraph(text, BOLD_LINE)

def SP(h=6):
    return Spacer(1, h)

# ── 表格 ─────────────────────────────────────────────
def make_table(data, col_widths, header=True):
    t = Table(data, colWidths=col_widths)
    style = [
        ('FONTNAME', (0, 0), (-1, -1), FONT_REG),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), TEXT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BORDER),
    ]
    if header:
        style.extend([
            ('BACKGROUND', (0, 0), (-1, 0), INDIGO),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
        ])
    t.setStyle(TableStyle(style))
    return t

def info_box(title, body, color=INDIGO, bg=INDIGO_LIGHT):
    inner = [
        [Paragraph(f'<font name="{FONT_BOLD}" color="white">{title}</font>',
                  ParagraphStyle('boxh', fontName=FONT_BOLD, fontSize=10,
                                textColor=white))],
        [Paragraph(body, ParagraphStyle('boxb', fontName=FONT_REG, fontSize=9,
                                       leading=14, textColor=TEXT))],
    ]
    t = Table(inner, colWidths=[160*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), color),
        ('BACKGROUND', (0, 1), (0, 1), bg),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('LINEBELOW', (0, 0), (0, 0), 0, color),
    ]))
    return t

def alert_box(level, title, body):
    colors = {
        'P1': (RED, RED_BG, '🔴 严重'),
        'M': (AMBER, AMBER_BG, '🟡 中等'),
        'L': (GRAY, GRAY_LIGHT, '⚪ 低'),
        'OK': (EMERALD, EMERALD_BG, '✅ 已修复'),
    }
    color, bg, prefix = colors.get(level, colors['M'])
    return info_box(f'{prefix}  {title}', body, color=color, bg=bg)

def code_block(text):
    safe = text.replace('<', '&lt;').replace('>', '&gt;')
    return Paragraph(safe.replace('\n', '<br/>'), CODE)

# ── 页眉页脚 ─────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT_REG, 8)
    canvas.setFillColor(GRAY)
    # 页眉
    canvas.drawString(20*mm, 285*mm, '息息·宇宙 v4.23.0 审查报告')
    canvas.drawRightString(190*mm, 285*mm, '2026-05-25')
    canvas.setStrokeColor(GRAY_BORDER)
    canvas.line(20*mm, 282*mm, 190*mm, 282*mm)
    # 页脚
    canvas.line(20*mm, 15*mm, 190*mm, 15*mm)
    canvas.drawCentredString(105*mm, 10*mm, f'— 第 {doc.page} 页 —')
    canvas.restoreState()

# ── 封面 ─────────────────────────────────────────────
def build_cover():
    story = []
    story.append(Spacer(1, 50*mm))
    story.append(P('息息·宇宙', H1))
    story.append(P('代码审查报告', H1))
    story.append(SP(15))
    story.append(P('v4.23.0', SUBTITLE))
    story.append(SP(40))

    meta = [
        ['项目', 'xixi-cosmos'],
        ['仓库', 'github.com/Wuyi1111/xixi-cosmos'],
        ['版本', 'v4.23.0 (commit 133a06f)'],
        ['技术栈', 'React 18 · Vite 5 · Tailwind 3 · Lucide React'],
        ['部署', 'wuyi1111.github.io/xixi-cosmos'],
        ['代码量', '5,698 行（17 个源文件，~915 行死代码）'],
        ['审查日期', '2026-05-25'],
    ]
    t = Table(meta, colWidths=[35*mm, 110*mm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), FONT_REG),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), FONT_BOLD),
        ('TEXTCOLOR', (0, 0), (0, -1), INDIGO),
        ('TEXTCOLOR', (1, 0), (1, -1), TEXT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, GRAY_BORDER),
    ]))
    story.append(t)
    story.append(SP(30))

    # 总体评分
    story.append(P('总体评分', H3))
    score = [
        ['维度', '评分', '说明'],
        ['代码质量', '★★★☆☆', '架构清晰但有 3 个文件 ~915 行死代码、5 个 userData 字段未注册'],
        ['视觉设计', '★★★★★', '深浅模式完整、动效精心、移动端体验佳'],
        ['稳定性', '★★☆☆☆', '4 个 P1 级 bug：白屏崩溃、夜声死按钮、定时器泄漏刷星尘、Section re-render'],
        ['功能完整度', '★★★☆☆', '夜声、睡前提醒、星愿池许愿、明日"公开"均为 UI 占位'],
        ['可维护性', '★★★☆☆', '相同逻辑分散 3 处、迁移/初值/reset 三处需同步、fontScale 默认值不一致'],
        ['移动端适配', '★★★★★', 'safe-area、16px 防缩放、PWA meta 都到位'],
    ]
    t = make_table(score, [27*mm, 22*mm, 96*mm])
    story.append(t)
    story.append(PageBreak())
    return story

# ── 各节内容 ─────────────────────────────────────────
def build_body():
    story = []

    # §1 项目概述
    story.append(P('1  项目概述', H2))
    story.append(P('<b>息息·宇宙</b> 是一个以睡前情绪陪伴为核心的 PWA 应用，部署在 GitHub Pages，'
                  '支持"添加到 iOS 主屏"接近原生 App 体验。所有数据存储于浏览器 localStorage，'
                  '没有任何后端。'))
    story.append(SP(6))
    story.append(B('v4.23.0 相比 v4.6.1 的主要变化'))
    changes = [
        ['领域', '变化'],
        ['Tab 结构', '此刻 / 微澜 / 星系 / 我的 → 此刻 / 雷达 / 星系 / 归星'],
        ['新增组件', 'SplashScreen（启动闪屏）、StarField（星空背景）、StarView（归星板块）'],
        ['废弃组件', 'MineView / DreamCard / BreathingWidget（仍在仓库内但已无引用）'],
        ['交互重构', '微澜 → 双 Tab（星海 + 明日）、明日重写为"约定 + 任务 + 足迹"'],
        ['打卡途径', '新增 handleInteractionCheckIn（送温暖/跟随触发打卡）+ StarView 归星仪式'],
        ['行为变化', 'pull-to-refresh 整套移除；新增"启动闪屏每次必显"'],
    ]
    story.append(make_table(changes, [38*mm, 113*mm]))
    story.append(SP(8))

    # §2 整体判断
    story.append(P('2  关键结论', H2))
    story.append(alert_box('P1', '不建议直接发布 v4.23.0 到生产环境',
        '当前存在 4 个 P1 级问题，其中 2 个会导致用户数据/经济异常：'
        '<br/><br/>'
        '① 初始化 JSON.parse 仍无 try-catch，localStorage 损坏 → 白屏'
        '<br/>'
        '② StarView 归星仪式定时器泄漏，关闭弹窗后仍会发放 +10 星尘，'
        '可被反复打开-关闭刷取无限星尘'
        '<br/>'
        '③ TonightView 子组件全部定义在父组件内部，每次 saveUserData '
        '都会让所有 Section unmount/remount，丢失子组件内部状态'
        '<br/>'
        '④ StarView 夜声白噪音 8 个按钮都没有音频实现，但显示假的播放动画'))
    story.append(SP(8))

    # §3 P1 级问题
    story.append(P('3  P1 级问题（必须修，建议升 v4.23.1 时处理）', H2))

    # P1-1
    story.append(P('P1-1 · App.jsx 初始化 JSON.parse 无 try-catch — 白屏崩溃', H3))
    story.append(P('<b>文件</b>：src/App.jsx:81-104'))
    story.append(P('<b>说明</b>：旧版报告（v4.6.1）就已标注此问题，至今未修。一旦 localStorage 中的 '
                  '<font face="Courier">xixi_cosmos_data</font> JSON 损坏（手动编辑、浏览器异常、扩展插件干扰等），'
                  '初始化 useEffect 会抛出 SyntaxError，整个 App 白屏，用户无自救手段。'))
    story.append(P('<b>当前代码</b>：'))
    story.append(code_block('useEffect(() => {\n'
                            '  const saved = localStorage.getItem("xixi_cosmos_data");\n'
                            '  if (saved) {\n'
                            '    const parsed = JSON.parse(saved);  // ← 抛错则整个 App 白屏\n'
                            '    ...\n'
                            '  }\n'
                            '}, []);'))
    story.append(P('<b>修复方案</b>：包一层 try-catch，损坏时清除并使用初始 state。'))
    story.append(code_block('try {\n'
                            '  const saved = localStorage.getItem("xixi_cosmos_data");\n'
                            '  if (saved) {\n'
                            '    const parsed = JSON.parse(saved);\n'
                            '    // ... 迁移逻辑\n'
                            '    setUserData(parsed);\n'
                            '  }\n'
                            '} catch {\n'
                            '  localStorage.removeItem("xixi_cosmos_data");\n'
                            '}'))
    story.append(SP(6))

    # P1-2
    story.append(P('P1-2 · StarView 夜声白噪音 8 个按钮全是死的', H3))
    story.append(P('<b>文件</b>：src/views/StarView.jsx:19-28, 69-70, 279-291'))
    story.append(P('<b>说明</b>：StarView 提供 8 种"夜声"选项（星河雨声、深空风声、月海潮汐等），'
                  '点击播放按钮翻转 isPlaying，并显示 5 条波形动画 UI，但代码里没有任何 '
                  '<font face="Courier">&lt;audio&gt;</font> 元素或 Web Audio API 调用，全部都是假象。'))
    story.append(P('比旧版 v4.6.1 的"宇宙白噪音"问题严重得多：旧版只是按钮点了没反应，'
                  'v4.23.0 是<b>主动展示假的播放动画</b>，用户会以为是手机音量问题或耳机断连，'
                  '而不是 App 功能未实现。'))
    story.append(P('<b>修复方案</b>（按力度递增）：'))
    story.append(P('① 最小修复：去掉播放动画 + 在按钮上加"即将上线"标注。<br/>'
                  '② 中等修复：接入静态音频文件（CDN 或 public/sounds/）+ HTMLAudioElement。<br/>'
                  '③ 完整修复：Web Audio API 程序化生成白噪音 + 循环淡入淡出。'))
    story.append(SP(6))

    # P1-3
    story.append(P('P1-3 · StarView 归星仪式定时器不可中断 — 重复奖励 bug', H3))
    story.append(P('<b>文件</b>：src/views/StarView.jsx:53, 72-94, 134-140'))
    story.append(P('<b>说明</b>：<font face="Courier">startBreathing()</font> 用了 7+ 层嵌套 '
                  '<font face="Courier">setTimeout</font>，所有 ID 都没保存到 ref。'
                  '<font face="Courier">closeRitual()</font> 试图清 '
                  '<font face="Courier">breathTimerRef.current</font>，但这个 ref 从未被赋值过。'))
    story.append(P('<b>后果</b>：用户在调息进行中点"跳过"，弹窗关闭但 setTimeout 链继续跑，'
                  '到时 <font face="Courier">completeRitual()</font> 仍会触发，写入 checkInHistory '
                  '并发放 +10 星尘。<b>反复打开-关闭归星仪式 = 无限刷星尘漏洞。</b>'))
    story.append(P('<b>当前代码</b>：'))
    story.append(code_block('const startBreathing = () => {\n'
                            '  setRitualPhase("breathing");\n'
                            '  let cycle = 0;\n'
                            '  const runCycle = () => {\n'
                            '    setBreathPhase("inhale");\n'
                            '    setTimeout(() => {   // ← 没存 ID\n'
                            '      setBreathPhase("hold");\n'
                            '      setTimeout(() => {  // ← 没存 ID\n'
                            '        ...\n'
                            '          if (cycle < 3) runCycle();\n'
                            '          else completeRitual();  // 必然触发\n'
                            '      }, 3000);\n'
                            '    }, 3000);\n'
                            '  };\n'
                            '  runCycle();\n'
                            '};'))
    story.append(P('<b>修复方案</b>：把所有 setTimeout ID 收集到 ref 数组，'
                  '<font face="Courier">closeRitual</font> 时全部 clear，'
                  '并在 <font face="Courier">completeRitual</font> 内加 isOpen 短路防御。'))
    story.append(SP(6))

    # P1-4
    story.append(P('P1-4 · TonightView 子组件每次 re-render 重建 — 状态丢失', H3))
    story.append(P('<b>文件</b>：src/views/TonightView.jsx:98-499'))
    story.append(P('<b>说明</b>：<font face="Courier">HeroSection / AppIntroSection / QuizSection / '
                  'GalaxySection / SupernovaSection / NavigationSection</font> 全部定义在 TonightView 函数体内。'
                  '每次父组件 re-render（saveUserData、quiz 状态变化等），它们都会被识别为<b>新组件</b>，'
                  '触发完整 unmount/remount。'))
    story.append(P('<b>后果</b>：子组件内的 <font face="Courier">useState</font>'
                  '（如 QuizSection 的 <font face="Courier">showDetail</font>、SupernovaSection 的 '
                  '<font face="Courier">activeIndex</font>）每次都被重置为初始值。'
                  '滚动位置、展开状态、当前选中卡片都会丢失。'))
    story.append(P('<b>开发者已注意到此问题</b>：line 35-39 把 '
                  '<font face="Courier">galaxyActiveIndex</font> 提到顶层作为绕过方案，'
                  '但同样的问题在 QuizSection / SupernovaSection 内的 state 还没处理。'))
    story.append(P('<b>修复方案</b>：把所有 Section 提到组件外部（同文件顶层 function 声明），'
                  '或者改成 inline JSX 直接展开渲染。最简单的方式是把内部 state 全部提升到 '
                  'TonightView 顶层。'))
    story.append(SP(6))

    story.append(PageBreak())

    # §4 中等问题
    story.append(P('4  M 级问题（建议尽快修复）', H2))

    medium = [
        ['编号', '位置', '问题', '修复建议'],
        ['M-1', 'StarView.jsx:97-132',
         'completeRitual 缺 hasCheckedInToday 防御，仅靠按钮 disabled 拦截',
         '函数体首行加 if (hasCheckedInToday) return; 防御'],
        ['M-2', 'StarView.jsx:152-158',
         'reset 配置缺新字段 interactionHistory / lastInteractionDate',
         '提取 INITIAL_USER_DATA 常量到 constants.js 统一引用'],
        ['M-3', 'StarView.jsx:400 + GalaxyView.jsx:48',
         'userData.totalFollows 字段从未在初值/迁移中定义，归星页"同行者"永远 0',
         'App.jsx 初值加 totalFollows: 0，迁移加 if (...) parsed.totalFollows = 0'],
        ['M-4', 'SettingsPanel.jsx:408-432',
         '睡前提醒纯 UI 占位，没有 Service Worker / Web Push 实现',
         '开关旁加"(暂不支持推送)"标注，或暂时隐藏该区块'],
        ['M-5', 'SettingsPanel.jsx:109-123',
         '版本检查 fetch 没有 AbortController + 超时',
         'fetch 加 AbortController 5s 超时；timeout 后 setVersionCheckState("error")'],
        ['M-6', 'WishPoolView.jsx:286-289',
         '许愿按钮显示"送上宇宙 · X 颗星尘"暗示扣星尘，免责声明在按钮下方易忽略',
         '按钮文案改"许下心愿（预览）"，banner 顶部加"预览版·不扣星尘"芯片'],
        ['M-7', 'TreeholeView.jsx:255-270 / 223-225',
         '发布"公开"明日约定时创建 userChallenges，但热门任务只读 displayedSuggestions',
         '把 userChallenges 合并到 hotTasks 数组，或暂时移除"公开"开关'],
    ]
    story.append(make_table(medium, [13*mm, 38*mm, 55*mm, 45*mm]))
    story.append(SP(8))

    # §5 低优先级
    story.append(P('5  L 级问题（可后续清理）', H2))

    low = [
        ['编号', '位置 / 内容', '修复建议'],
        ['L-1', '~915 行死代码：MineView.jsx (222) / DreamCard.jsx (270) / BreathingWidget.jsx (423)',
         '确认无运行时引用后直接 git rm'],
        ['L-2', '5 个 userData 字段未注册：followedSuggestions / userChallenges / myTomorrowTasks / '
                'taskFootprints / totalFollows（仅 TreeholeView/StarView 用 || [] 防御）',
         'App.jsx 初值 + 迁移 useEffect 统一加上'],
        ['L-3', 'App.jsx:7 docstring 写"心愿池/我的"但实际为"雷达/星系/归星"',
         '同步更新注释'],
        ['L-4', 'constants.js MOCK_WISHES 8 条全部 userName: "星海旅人"',
         '换 8 个不同 mock 用户名（GalaxyView 的 MOCK_RANKINGS 已经做对了）'],
        ['L-5', 'fontScale 默认值不一致：App.jsx 0.85 / SettingsPanel "恢复默认" 1.0 / StarView reset 1.0',
         '统一为 1.0（或都改为 0.85）'],
        ['L-6', 'SplashScreen 每次打开 App 都强制显示 12-15 秒',
         '加"今日不再显示"开关，或检查 sessionStorage 仅当天显示一次'],
        ['L-7', 'SplashScreen.jsx:22 finish() 内层 setTimeout 未追踪',
         '把这个 setTimeout 也存到 timersRef，避免组件卸载后触发 setState 警告'],
        ['L-8', 'SettingsPanel.jsx:328 字号滑动条每个 step 都 setItem',
         '改为 onMouseUp / onTouchEnd 触发保存，拖动时只更新内存'],
        ['L-9', 'StarView.jsx:554-559 内嵌 <style> 标签插入 sound-wave keyframes',
         '搬到 src/index.css 与项目其他动画保持一致'],
        ['L-10', 'App.jsx:97 注释 "v5.0.0 新增字段迁移" 但 package.json 是 4.23.0',
         '改为 "v4.23.0 新增字段迁移"，避免版本号注释让人困惑'],
    ]
    story.append(make_table(low, [13*mm, 80*mm, 58*mm]))
    story.append(SP(8))

    story.append(PageBreak())

    # §6 旧 Bug 复核
    story.append(P('6  旧版 (v4.6.1) 9 个 Bug 在 v4.23.0 复核结果', H2))
    revisit = [
        ['旧编号', '描述', 'v4.23.0 状态'],
        ['P1-1', 'App.jsx 初始化 JSON.parse 无 try-catch',
         '❌ 未修，仍然存在'],
        ['P1-2', '"宇宙白噪音" 按钮无 onClick',
         '⚠️ 旧按钮已删，但被 StarView 8 个"夜声"按钮取代，问题升级（见 P1-2）'],
        ['P1-3', 'pull-to-refresh 迁移缺 3 个字段',
         '✅ 自然消失 — pull-to-refresh 整套已删除'],
        ['M-1', '睡前提醒 UI 占位无实现',
         '❌ 未修，仍然存在（见 M-4）'],
        ['M-2', '心形粒子在宽屏偏移',
         '✅ 自然修复 — main 已无 transform，position:fixed 工作正常'],
        ['M-3', '版本检查无 AbortController 超时',
         '❌ 未修，仍然存在（见 M-5）'],
        ['M-4', 'pull-to-refresh useEffect 依赖 state 频繁重建监听器',
         '✅ 自然修复 — pull-to-refresh 已删除'],
        ['M-5', 'reset 初始对象硬编码与 App.jsx useState 初值不同步',
         '❌ 更严重了 — 新字段 interactionHistory/lastInteractionDate 没同步（见 M-2）'],
        ['M-6', '星愿池许愿 "X 颗星尘" 误导',
         '❌ 未修，仍然存在（见 M-6）'],
    ]
    story.append(make_table(revisit, [16*mm, 78*mm, 60*mm]))
    story.append(SP(8))

    # §7 建议修复顺序
    story.append(P('7  推荐修复顺序', H2))
    story.append(P('<b>阶段 1：止血（约 2 小时）— 升 v4.23.1</b>'))
    story.append(P('1. 给 App.jsx 初始化 useEffect 加 try-catch（P1-1）<br/>'
                  '2. StarView 仪式定时器收集到 ref 数组，closeRitual 时全部 clear（P1-3）<br/>'
                  '3. completeRitual 头部加 hasCheckedInToday 防御（M-1）<br/>'
                  '4. 版本检查 fetch 加 AbortController 5s（M-5）'))
    story.append(SP(4))

    story.append(P('<b>阶段 2：诚信度（约 1 小时）— 升 v4.23.2</b>'))
    story.append(P('5. 夜声按钮加 disabled + "即将上线" 文案，去掉播放动画（P1-2）<br/>'
                  '6. 睡前提醒加"暂不支持推送"标注（M-4）<br/>'
                  '7. 星愿池许愿按钮文案 + 顶部预览版芯片（M-6）'))
    story.append(SP(4))

    story.append(P('<b>阶段 3：架构清理（约 3 小时）— 升 v4.24.0</b>'))
    story.append(P('8. TonightView Section 提出函数体外或改 inline JSX（P1-4）<br/>'
                  '9. 提取 INITIAL_USER_DATA 常量到 constants.js，App.jsx + StarView reset 共用（M-2）<br/>'
                  '10. App.jsx 注册 5 个 TreeholeView/StarView 使用的 userData 字段（L-2）<br/>'
                  '11. 删除 3 个孤儿文件 MineView/DreamCard/BreathingWidget（L-1）'))
    story.append(SP(4))

    story.append(P('<b>阶段 4：体验打磨（约 2 小时）— 升 v4.24.1</b>'))
    story.append(P('12. SplashScreen 加"今日不再显示"或 sessionStorage 短路（L-6）<br/>'
                  '13. 字号滑动条改 onMouseUp 保存（L-8）<br/>'
                  '14. MOCK_WISHES 换 8 个不同名字（L-4）<br/>'
                  '15. fontScale 默认值统一（L-5）'))
    story.append(SP(8))

    # §8 可直接执行的 Todo
    story.append(P('8  可直接执行的 Todo List', H2))
    todos = [
        '☐ App.jsx 初始化 useEffect 用 try-catch 包裹 JSON.parse',
        '☐ StarView startBreathing 把所有 setTimeout ID 存到 timersRef.current 数组',
        '☐ StarView closeRitual 遍历 timersRef.current 全部 clearTimeout',
        '☐ StarView completeRitual 函数体首行加 if (hasCheckedInToday) return;',
        '☐ SettingsPanel handleCheckVersion 用 AbortController + setTimeout(5000) 超时',
        '☐ StarView 夜声卡片：去掉播放动画 + 加 disabled + tooltip "即将上线"',
        '☐ SettingsPanel 睡眠守护区块加"(暂不支持推送)"小标签',
        '☐ WishPoolView 许愿弹窗顶部加"预览版 · 不扣星尘"芯片',
        '☐ TonightView 三个内部 Section 提到组件外部（function 声明）',
        '☐ constants.js 导出 INITIAL_USER_DATA 常量，App.jsx + StarView 引用',
        '☐ App.jsx userData 初值加 5 个新字段 + 迁移 useEffect 同步加上',
        '☐ App.jsx:97 注释 "v5.0.0" 改为 "v4.23.0"',
        '☐ App.jsx:7 docstring 注释 tab 名同步为 "此刻/雷达/星系/归星"',
        '☐ git rm src/views/MineView.jsx src/widgets/DreamCard.jsx src/widgets/BreathingWidget.jsx',
        '☐ constants.js MOCK_WISHES 8 个不同 userName',
        '☐ SplashScreen 加 sessionStorage 标记，当天只显示一次',
        '☐ SettingsPanel 字号滑动条 onChange 改 onMouseUp/onTouchEnd 保存',
        '☐ fontScale 默认值统一为 1.0（App 初值 + 迁移 fallback + StarView reset）',
        '☐ StarView 内嵌 <style> 的 sound-wave keyframes 搬到 index.css',
        '☐ TreeholeView 移除"公开"选项 或 实现 userChallenges → 热门任务 的合并',
    ]
    for t in todos:
        safe = t.replace('<', '&lt;').replace('>', '&gt;')
        story.append(Paragraph(safe, BODY_SMALL))
    story.append(SP(8))

    # 收尾
    story.append(P('— 报告结束 —', SUBTITLE))
    story.append(SP(4))
    story.append(P('如需以上任何修复项的具体 diff，请告知。'
                  '修复完成后建议运行：<font face="Courier">npm run build</font> '
                  '验证无新增 warning。', BODY_SMALL))

    return story

# ── 主流程 ───────────────────────────────────────────
def main():
    out_path = os.path.join(os.path.dirname(__file__), 'xixi-cosmos-v4.23.0-审查报告.pdf')
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=22*mm,
        bottomMargin=20*mm,
        title='息息·宇宙 v4.23.0 审查报告',
        author='Code Review',
    )
    story = build_cover() + build_body()
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f'✅  PDF 已生成：{out_path}')

if __name__ == '__main__':
    main()
