
Prefer a **semantic**, **role-based** CSS structure, where *class names* reflect the visual or structural role, not the business feature or domain entity. 
This avoids coupling styles to specific app features and encourages *global reuse*, *consistency*, and *simplification*. 

Actively avoid *domain-driven* or *feature-specific* class names like 
```
.payment-header or .checkout-btn
```

They bloat CSS with redundant, isolated styles.

---
- **Semantic**
- **Reusable**
- **Generic**
```
.header, .subheader, .btn-primary
```

---

- **Specific**
- **Domain-tied**
```
.payment-header, .checkout-btn
```
