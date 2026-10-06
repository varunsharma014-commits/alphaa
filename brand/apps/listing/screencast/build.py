# Builds the Shopify review screencast: real screenshots of the install -> plan -> connect ->
# draft -> publish -> undo flow on dev store alphaa-test, each with a caption bar.
import glob, os, subprocess
from PIL import Image, ImageDraw, ImageFont
D = "/Users/varunsharma/.claude/projects/-Users-varunsharma/ee263b08-a926-4cf3-ab44-9c718a11b44c/tool-results"
STEPS = [
  ("1791241591352-dq1i14", "1. The merchant installs Alphaa from Shopify and approves access to blog posts and pages."),
  ("1791288759119-1u9e9l", "2. Shopify shows Alphaa's plan: $99 per 30 days, billed by Shopify (free on development stores)."),
  ("1791287887045-ndm6n3", "3. The merchant approves the charge in Shopify. Alphaa reads the active plan and unlocks the account."),
  ("1791288338606-g9ssmj", "4. Back in Alphaa, the store shows as connected. Every change Alphaa makes can be undone."),
  ("1791288371104-vxzrwv", "5. In Posts & Pages, the merchant asks the Alphaa agent to write a post for their store."),
  ("1791288406105-pd5hzm", "6. The agent writes a post that answers a question customers ask AI assistants."),
  ("1791288416793-sy91yx", "7. The draft appears in the chat with a featured image. Nothing is published yet."),
  ("1791288422407-1r2dsm", "8. Highlighted bits are facts only the owner knows. The merchant fills them in before publishing."),
  ("1791288480338-otgwzx", "9. The merchant fills them in with Edit, then taps 'Publish it to my site'."),
  ("1791288506108-i24a2v", "10. Alphaa publishes the post to the store's blog through the Shopify Admin API and shows the live link."),
  ("1791288506108-oetpae", "11. In Shopify admin > Blog posts, the new post is visible, authored by Alphaa."),
  ("1791288732933-504cx4", "12. The merchant taps Undo. Alphaa unpublishes the post and keeps it as a draft."),
  ("1791288744824-b73mtb", "13. In Shopify admin the post is now Hidden. Uninstalling Alphaa removes its access."),
]
W, H, BAR = 1920, 1080, 120
font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 34)
os.makedirs("frames", exist_ok=True)
for i, (key, cap) in enumerate(STEPS):
    src = glob.glob(f"{D}/*{key}*")[0]
    im = Image.open(src).convert("RGB")
    s = min(W / im.width, (H - BAR) / im.height)
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    c = Image.new("RGB", (W, H), "black")
    c.paste(im, ((W - im.width) // 2, (H - BAR - im.height) // 2))
    d = ImageDraw.Draw(c)
    tw = d.textlength(cap, font=font)
    d.text(((W - tw) / 2, H - BAR + (BAR - 34) / 2 - 4), cap, font=font, fill="white")
    c.save(f"frames/{i:02d}.png")
# title + end cards
for name, lines in [("title", ["Alphaa for Shopify", "Install, choose a plan, publish a post, undo it"]), ("end", ["Alphaa", "Questions: hi@alphaa.app"])]:
    c = Image.new("RGB", (W, H), "black"); d = ImageDraw.Draw(c)
    f1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 72); f2 = font
    for j, (t, f) in enumerate(zip(lines, [f1, f2])):
        tw = d.textlength(t, font=f); d.text(((W - tw) / 2, 440 + j * 110), t, font=f, fill="white")
    c.save(f"frames/{name}.png")
with open("list.txt", "w") as fh:
    seq = ["title"] + [f"{i:02d}" for i in range(len(STEPS))] + ["end"]
    for n in seq:
        fh.write(f"file 'frames/{n}.png'\nduration {5 if n in ('title','end') else 14}\n")
    fh.write("file 'frames/end.png'\n")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "list.txt",
                "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                "alphaa-shopify-screencast.mp4"], check=True)
print("ok")
