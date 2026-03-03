import { chromium } from '@playwright/test';
import fs from 'fs';

async function debugProjectCreation() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    locale: 'es-ES',
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to dashboard/projects...');
    await page.goto('http://localhost:3000/dashboard/projects');
    await page.waitForLoadState('networkidle');

    console.log('Opening Create Project sheet...');
    const createBtn = page.getByRole('button', { name: /Crear Proyecto/i }).first();
    await createBtn.click();
    
    await page.waitForTimeout(1000); // Esperar animación
    
    console.log('Taking screenshot of the form...');
    await page.screenshot({ path: 'project-form-debug.png', fullPage: true });

    // Ver el HTML del formulario para ver los placeholders reales
    const formHtml = await page.locator('form').innerHTML();
    fs.writeFileSync('project-form-debug.html', formHtml);
    console.log('Form HTML saved to project-form-debug.html');

    // Listar todos los inputs y sus placeholders
    const inputs = await page.locator('input').all();
    console.log('Inputs found:');
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      console.log(`- ID: ${id}, Name: ${name}, Placeholder: ${placeholder}`);
    }

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugProjectCreation();
