// update-module8-mongo.mjs - native MongoDB update (no Prisma client needed)
import { MongoClient, ObjectId } from 'mongodb';

const URI = 'mongodb+srv://afribourse_admin:QnHJxG2wjoQll174@afribourse.ubtom7d.mongodb.net/afribourse?retryWrites=true&w=majority&appName=Afribourse';

const client = new MongoClient(URI);

async function main() {
    await client.connect();
    const db = client.db('afribourse');
    const col = db.collection('learning_modules');

    const module8 = await col.findOne({ order_index: 8 });
    if (!module8) {
        console.error('Module 8 introuvable');
        process.exit(1);
    }
    console.log(`Module trouvé: ${module8.title} (${module8.slug})`);

    const result = await col.updateOne(
        { _id: module8._id },
        {
            $set: {
                attachment_url: '/files/UNIWAX_Rapport_Analyse_Complete_2026.pdf',
                dashboard_url: 'https://www.africbourse.com/stock/UNXC/UNIWAX_Dashboard_Analytique',
            },
        }
    );

    console.log(`Modifié: ${result.modifiedCount} document(s)`);
    console.log('  attachment_url → /files/UNIWAX_Rapport_Analyse_Complete_2026.pdf');
    console.log('  dashboard_url  → https://www.africbourse.com/stock/UNXC/UNIWAX_Dashboard_Analytique');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => client.close());
