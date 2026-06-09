import type { INestApplication } from '@nestjs/common';
import { apiReference } from '@scalar/nestjs-api-reference';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { appConfig } from './app.config';

function filterSwaggerDocument(
  document: OpenAPIObject,
  allowedPrefixes: string[],
): OpenAPIObject {
  const paths = Object.fromEntries(
    Object.entries(document.paths).filter(([path]) =>
      allowedPrefixes.some(
        (prefix) => path.startsWith(prefix) || path.startsWith(`/${appConfig.apiPrefix}${prefix}`),
      ),
    ),
  );

  return {
    ...document,
    paths,
  };
}

const adminScalarTheme = `
.light-mode {
  --scalar-color-accent: #b42318;
  --scalar-background-accent: #b4231814;
}
.dark-mode {
  --scalar-color-accent: #f97066;
  --scalar-background-accent: #f970661f;
}
`;

const mobileScalarTheme = `
.light-mode {
  --scalar-color-accent: #155eef;
  --scalar-background-accent: #155eef14;
}
.dark-mode {
  --scalar-color-accent: #84adff;
  --scalar-background-accent: #84adff1f;
}
`;

export function setupApiDocs(app: INestApplication) {
  const documentConfig = new DocumentBuilder()
    .setTitle('Teamflow API')
    .setDescription('Teamflow backend API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste a valid JWT access token',
      },
      'bearer',
    )
    .build();

  const fullDocument = SwaggerModule.createDocument(app, documentConfig);
  const adminDocument = filterSwaggerDocument(fullDocument, ['/admin', '/auth']);
  const mobileDocument = filterSwaggerDocument(fullDocument, [
    '/mobile',
    '/auth',
  ]);

  app.use(
    `/${appConfig.apiPrefix}/${appConfig.docs.adminPath}`,
    apiReference({
      content: adminDocument,
      pageTitle: 'Teamflow Admin API',
      theme: 'kepler',
      customCss: adminScalarTheme,
    }),
  );

  app.use(
    `/${appConfig.apiPrefix}/${appConfig.docs.mobilePath}`,
    apiReference({
      content: mobileDocument,
      pageTitle: 'Teamflow Mobile API',
      theme: 'purple',
      customCss: mobileScalarTheme,
    }),
  );
}
