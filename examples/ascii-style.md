# ASCII Style Boxes

Classic ASCII art using `+`, `-`, and `|` characters instead of Unicode box-drawing.

## Before

```
+------------------------+
| Database Connection    |
| Host: localhost        |
| Port: 5432             |
+------------------------+
        |
        v
+------------------------+
| Connection Pool        |
| Max: 10                |
| Timeout: 30s           |
+------------------------+
```

## After (Fixed)

```
+------------------------+
| Database Connection    |
| Host: localhost        |
| Port: 5432             |
+------------------------+
        |
        v
+------------------------+
| Connection Pool        |
| Max: 10                |
| Timeout: 30s           |
+------------------------+
```

## What Changed

- Content lines padded to match the 26-character boundary width
- Works the same as Unicode boxes - boundary lines are the reference
