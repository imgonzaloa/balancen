import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

const policy = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: April 2026",
    contact_box_title: "Questions or Concerns?",
    contact_box_body: "Contact us at",
    sections: [
      {
        heading: "1. Data We Collect",
        items: [
          { label: "Account Information", text: "Your email address and display name, collected when you create an account." },
          { label: "Food Photos", text: "Photos you take using the camera feature are sent to our AI provider for nutritional analysis only. They are not stored permanently after processing." },
          { label: "Body Metrics", text: "Height, weight, and age that you provide are stored securely to personalize your calorie goals." },
          { label: "Meal Logs & Nutrition Data", text: "Estimated calories, protein, carbs, and fats from each logged meal, along with timestamps and optional notes." },
          { label: "Usage Data & Streaks", text: "Daily check-in records, streak counts, badges earned, and app usage patterns used to calculate your progress." },
        ],
      },
      {
        heading: "2. How We Use Your Data",
        items: [
          { label: "AI Meal Analysis", text: "Your food photos are analyzed by AI to estimate nutritional content and provide personalized insights." },
          { label: "Personalize Calorie Goals", text: "Your body metrics and activity level are used to calculate and adjust your daily calorie target." },
          { label: "Social Feed", text: "Meal logs and achievements can be shared with friends you follow, based on your privacy settings." },
          { label: "Streak & Progress", text: "Daily check-in data is used to calculate your consistency streak and display your progress over time." },
        ],
      },
      {
        heading: "3. AI Processing",
        body: "Food photos you submit via the camera feature are transmitted to our AI provider solely for the purpose of nutritional analysis. These images are not stored after processing is complete. By using the camera feature, you consent to this temporary AI processing of your food photos.",
      },
      {
        heading: "4. Data Sharing",
        items: [
          { label: "Base44", text: "Our app is built on Base44's infrastructure, which securely hosts your data." },
          { label: "AI Providers", text: "Food photos are shared with our AI provider for analysis only, and are not retained after processing." },
          { label: "No Data Sales", text: "We never sell, rent, or trade your personal data to third parties. Your data is never used for advertising." },
          { label: "Legal Compliance", text: "We may disclose data only when required by law to protect user safety." },
        ],
      },
      {
        heading: "5. Your Rights",
        body: "You can access your data, correct your profile information, or delete your account at any time from Settings → Delete Account. All your data will be permanently removed within 30 days of account deletion. EU users have additional rights under GDPR, including the right to access, rectify, erase, restrict, and port your data, and to object to processing. To exercise any of these rights, contact us at hello@balancen.app.",
      },
      {
        heading: "6. Children",
        body: "Balancen is not intended for users under 13 years of age. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with data, please contact us at hello@balancen.app and we will delete it immediately.",
      },
      {
        heading: "7. Contact",
        body: "For any questions about this Privacy Policy or your data, please reach out to us at hello@balancen.app.",
      },
    ],
  },
  es: {
    title: "Política de Privacidad",
    lastUpdated: "Última actualización: Abril 2026",
    contact_box_title: "¿Preguntas o inquietudes?",
    contact_box_body: "Contáctanos en",
    sections: [
      {
        heading: "1. Datos que recopilamos",
        items: [
          { label: "Información de cuenta", text: "Tu correo electrónico y nombre para mostrar, recopilados al crear tu cuenta." },
          { label: "Fotos de alimentos", text: "Las fotos que tomas con la cámara se envían a nuestro proveedor de IA únicamente para análisis nutricional. No se almacenan de forma permanente tras el procesamiento." },
          { label: "Métricas corporales", text: "Altura, peso y edad que proporcionas se almacenan de forma segura para personalizar tu objetivo calórico." },
          { label: "Registros de comidas y datos nutricionales", text: "Calorías, proteínas, carbohidratos y grasas estimadas de cada comida registrada, junto con marcas de tiempo y notas opcionales." },
          { label: "Datos de uso y rachas", text: "Registros diarios de check-in, rachas, insignias obtenidas y patrones de uso para calcular tu progreso." },
        ],
      },
      {
        heading: "2. Cómo usamos tus datos",
        items: [
          { label: "Análisis de comidas con IA", text: "Tus fotos de alimentos son analizadas por IA para estimar el contenido nutricional y darte recomendaciones personalizadas." },
          { label: "Personalizar tu objetivo calórico", text: "Tus métricas corporales y nivel de actividad se usan para calcular y ajustar tu meta calórica diaria." },
          { label: "Feed social", text: "Tus comidas y logros pueden compartirse con amigos que sigues, según tu configuración de privacidad." },
          { label: "Racha y progreso", text: "Los datos de check-in diarios se usan para calcular tu racha de consistencia y mostrar tu progreso a lo largo del tiempo." },
        ],
      },
      {
        heading: "3. Procesamiento por IA",
        body: "Las fotos de alimentos que envías a través de la cámara se transmiten a nuestro proveedor de IA únicamente para análisis nutricional. Estas imágenes no se almacenan una vez finalizado el procesamiento. Al usar la función de cámara, consientes este procesamiento temporal de tus fotos por parte de la IA.",
      },
      {
        heading: "4. Compartición de datos",
        items: [
          { label: "Base44", text: "Nuestra app está construida sobre la infraestructura de Base44, que aloja tus datos de forma segura." },
          { label: "Proveedores de IA", text: "Las fotos de alimentos se comparten con nuestro proveedor de IA únicamente para el análisis y no se conservan tras el procesamiento." },
          { label: "No vendemos tus datos", text: "Nunca vendemos, alquilamos ni cedemos tus datos personales a terceros. Tus datos nunca se usan con fines publicitarios." },
          { label: "Cumplimiento legal", text: "Podemos divulgar datos solo cuando la ley lo exija para proteger la seguridad de los usuarios." },
        ],
      },
      {
        heading: "5. Tus derechos",
        body: "Puedes acceder a tus datos, corregir tu información de perfil o eliminar tu cuenta en cualquier momento desde Configuración → Eliminar cuenta. Todos tus datos se eliminarán permanentemente en un plazo de 30 días. Los usuarios de la UE tienen derechos adicionales bajo el RGPD, incluidos el acceso, rectificación, supresión, portabilidad y oposición al tratamiento. Contacta con nosotros en hello@balancen.app para ejercer estos derechos.",
      },
      {
        heading: "6. Menores de edad",
        body: "Balancen no está dirigido a usuarios menores de 13 años. No recopilamos datos personales de menores de forma consciente. Si crees que un menor nos ha proporcionado datos, contáctanos en hello@balancen.app y los eliminaremos de inmediato.",
      },
      {
        heading: "7. Contacto",
        body: "Para cualquier pregunta sobre esta política de privacidad o sobre tus datos, escríbenos a hello@balancen.app.",
      },
    ],
  },
  pt: {
    title: "Política de Privacidade",
    lastUpdated: "Última atualização: Abril de 2026",
    contact_box_title: "Dúvidas ou preocupações?",
    contact_box_body: "Entre em contato pelo",
    sections: [
      {
        heading: "1. Dados que coletamos",
        items: [
          { label: "Informações da conta", text: "Seu e-mail e nome de exibição, coletados ao criar uma conta." },
          { label: "Fotos de alimentos", text: "As fotos tiradas com a câmera são enviadas ao nosso provedor de IA apenas para análise nutricional. Não são armazenadas permanentemente após o processamento." },
          { label: "Métricas corporais", text: "Altura, peso e idade que você fornece são armazenados com segurança para personalizar sua meta calórica." },
          { label: "Registros de refeições e dados nutricionais", text: "Calorias estimadas, proteínas, carboidratos e gorduras de cada refeição registrada, com horários e notas opcionais." },
          { label: "Dados de uso e sequências", text: "Registros diários de check-in, sequências, conquistas e padrões de uso para calcular seu progresso." },
        ],
      },
      {
        heading: "2. Como usamos seus dados",
        items: [
          { label: "Análise de refeições com IA", text: "Suas fotos de alimentos são analisadas por IA para estimar o conteúdo nutricional e fornecer insights personalizados." },
          { label: "Personalizar sua meta calórica", text: "Suas métricas corporais e nível de atividade são usados para calcular e ajustar sua meta calórica diária." },
          { label: "Feed social", text: "Refeições e conquistas podem ser compartilhadas com amigos que você segue, de acordo com suas configurações de privacidade." },
          { label: "Sequência e progresso", text: "Os dados de check-in diário são usados para calcular sua sequência de consistência e exibir seu progresso ao longo do tempo." },
        ],
      },
      {
        heading: "3. Processamento por IA",
        body: "As fotos de alimentos enviadas pela câmera são transmitidas ao nosso provedor de IA exclusivamente para análise nutricional. Essas imagens não são armazenadas após o processamento. Ao usar a função da câmera, você consente com esse processamento temporário das suas fotos pela IA.",
      },
      {
        heading: "4. Compartilhamento de dados",
        items: [
          { label: "Base44", text: "Nosso app é construído sobre a infraestrutura da Base44, que hospeda seus dados com segurança." },
          { label: "Provedores de IA", text: "Fotos de alimentos são compartilhadas com nosso provedor de IA apenas para análise e não são retidas após o processamento." },
          { label: "Não vendemos seus dados", text: "Nunca vendemos, alugamos ou cedemos seus dados pessoais a terceiros. Seus dados nunca são usados para publicidade." },
          { label: "Conformidade legal", text: "Podemos divulgar dados apenas quando a lei exigir para proteger a segurança dos usuários." },
        ],
      },
      {
        heading: "5. Seus direitos",
        body: "Você pode acessar seus dados, corrigir informações do perfil ou excluir sua conta a qualquer momento em Configurações → Excluir conta. Todos os seus dados serão removidos permanentemente em até 30 dias. Usuários da UE têm direitos adicionais sob o RGPD, incluindo acesso, retificação, exclusão, portabilidade e oposição ao tratamento. Entre em contato pelo hello@balancen.app para exercer esses direitos.",
      },
      {
        heading: "6. Crianças",
        body: "O Balancen não é destinado a usuários menores de 13 anos. Não coletamos conscientemente dados pessoais de crianças menores de 13 anos. Se acreditar que uma criança nos forneceu dados, entre em contato pelo hello@balancen.app e os excluiremos imediatamente.",
      },
      {
        heading: "7. Contato",
        body: "Para qualquer dúvida sobre esta Política de Privacidade ou sobre seus dados, escreva para hello@balancen.app.",
      },
    ],
  },
};

export default function PrivacyPolicy() {
  const { lang } = useTranslation();
  const content = policy[lang] || policy.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
      <div className="max-w-lg mx-auto px-4 pb-24 pt-4">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Settings")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">{content.title}</h1>
        </div>

        <div className="rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 space-y-7 text-white/80 text-sm leading-relaxed">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-base font-bold text-white mb-3">{section.heading}</h2>
              {section.body && <p>{section.body}</p>}
              {section.items && (
                <div className="space-y-2.5">
                  {section.items.map((item) => (
                    <p key={item.label}>
                      <span className="font-semibold text-white/90">{item.label}: </span>
                      {item.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="bg-teal-500/20 border border-teal-500/40 rounded-xl p-4 mt-2">
            <p className="text-teal-300 font-semibold mb-1">{content.contact_box_title}</p>
            <p>{content.contact_box_body}{" "}
              <a href="mailto:hello@balancen.app" className="text-teal-300 font-semibold">hello@balancen.app</a>
            </p>
            <p className="text-xs text-white/50 mt-2">{content.lastUpdated}</p>
          </div>
        </div>
      </div>
    </div>
  );
}