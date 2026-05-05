/**
 * Quick test to verify template exports work correctly
 */

import { ALL_CERTIFICATE_TEMPLATES } from "./templates";

console.log("🧪 Testing certificate template exports...");
console.log(`📊 Total templates found: ${ALL_CERTIFICATE_TEMPLATES.length}`);

ALL_CERTIFICATE_TEMPLATES.forEach((template, index) => {
  console.log(
    `${index + 1}. ${template.name} (${template.id}) - ${
      template.organization
    }/${template.category}`
  );

  // Validate required fields
  if (
    !template.id ||
    !template.name ||
    !template.organization ||
    !template.category
  ) {
    console.error(`❌ Template missing required fields:`, template);
  } else {
    console.log(`   ✅ Valid template structure`);
  }

  // Validate elements exist
  if (!template.elements || template.elements.length === 0) {
    console.warn(`⚠️  Template has no elements:`, template.id);
  } else {
    console.log(`   📝 Elements: ${template.elements.length}`);
  }
});

console.log("✅ Template export test completed!");
