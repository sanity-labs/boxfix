# ASCII Style Boxes (Before)

Classic ASCII art with misaligned content lines.

```nofix
+------------------------+
| Database Connection   |
| Host: localhost       |
| Port: 5432|
+------------------------+
        |
        v
+------------------------+
| Connection Pool|
| Max: 10       |
| Timeout: 30s  |
+------------------------+
```

Content lines vary in length. Run `boxfix` to align them to the 26-character boundary.
